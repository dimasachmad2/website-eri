// Otomatisasi Tahap E + F (idempotent — aman dijalankan ulang):
//  E) policy+role "Reader", user "Build Bot" + token baca-saja,
//     izin Public baca file, lalu simpan token ke GitHub secret DIRECTUS_TOKEN
//  F) (opsional, bila GITHUB_DISPATCH_TOKEN diset) Flow "Rebuild website"
//     yang memicu GitHub Actions saat artikel dibuat/diubah/dihapus.
//
// Jalankan dari laptop (PowerShell, folder website-eri):
//   $env:DIRECTUS_URL="https://cms.enviroresources.co.id"
//   $env:ADMIN_EMAIL="info@enviroresources.co.id"
//   $env:ADMIN_PASSWORD="..."
//   $env:GITHUB_DISPATCH_TOKEN="github_pat_..."   # opsional (Tahap F)
//   node infra/directus/setup-access.mjs
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const REPO = 'dimasachmad2/website-eri';
const url = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, GITHUB_DISPATCH_TOKEN: ghPat } = process.env;
if (!url || !email || !password) {
  console.error('Set DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD dulu.');
  process.exit(1);
}

// ── API helper ────────────────────────────────────────────────────────────
const login = await fetch(`${url}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) throw new Error(`Login admin gagal (${login.status}). Cek email/password.`);
const adminToken = (await login.json()).data.access_token;

async function api(method, path, body, token = adminToken) {
  const r = await fetch(`${url}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : (await r.json()).data;
}
const first = async (path) => (await api('GET', path))[0];
const q = (s) => encodeURIComponent(s);

async function ensureReadPermission(policyId, collection) {
  const existing = await first(
    `/permissions?filter[policy][_eq]=${policyId}&filter[collection][_eq]=${collection}&filter[action][_eq]=read&limit=1`,
  );
  if (existing) return false;
  await api('POST', '/permissions', { policy: policyId, collection, action: 'read', fields: ['*'], permissions: {} });
  return true;
}

// ── E1. Policy "Reader" ───────────────────────────────────────────────────
let policy = await first(`/policies?filter[name][_eq]=Reader&limit=1`);
if (!policy) {
  policy = await api('POST', '/policies', {
    name: 'Reader', icon: 'visibility', description: 'Baca-saja untuk build website',
    admin_access: false, app_access: false,
  });
  console.log('✓ Policy Reader dibuat');
} else console.log('• Policy Reader sudah ada');
for (const c of ['articles', 'directus_files']) {
  if (await ensureReadPermission(policy.id, c)) console.log(`  ✓ Reader boleh baca ${c}`);
}

// ── E2. Role "Reader" ─────────────────────────────────────────────────────
let role = await first(`/roles?filter[name][_eq]=Reader&limit=1`);
if (!role) {
  role = await api('POST', '/roles', { name: 'Reader', icon: 'visibility', policies: { create: [{ policy: policy.id }] } });
  console.log('✓ Role Reader dibuat');
} else console.log('• Role Reader sudah ada');

// ── E3. User "Build Bot" + token ──────────────────────────────────────────
// Directus menyamarkan token yang sudah ada ("**********") di respons API,
// jadi token baru hanya dibuat/disimpan bila Build Bot belum punya token.
let bot = await first(`/users?filter[first_name][_eq]=${q('Build Bot')}&fields=id,token&limit=1`);
let token = null; // hanya terisi bila token BARU dibuat pada run ini
if (!bot) {
  token = randomBytes(32).toString('hex');
  bot = await api('POST', '/users', { first_name: 'Build Bot', role: role.id, status: 'active', token });
  console.log('✓ User Build Bot dibuat');
} else if (!bot.token) {
  token = randomBytes(32).toString('hex');
  await api('PATCH', `/users/${bot.id}`, { token });
  console.log('✓ Token Build Bot dibuat');
} else console.log('• User Build Bot sudah punya token — secret GitHub tidak diubah');

if (token) {
  // Uji token: harus bisa baca artikel.
  await api('GET', '/items/articles?limit=1', null, token);
  console.log('  ✓ Token Build Bot bisa membaca articles');
}

// ── Izin Public: baca file (gambar di isi artikel) ────────────────────────
const pub = await first(`/policies?filter[name][_eq]=${q('$t:public_label')}&limit=1`);
if (pub) {
  if (await ensureReadPermission(pub.id, 'directus_files')) console.log('✓ Public boleh baca file');
  else console.log('• Public sudah boleh baca file');
} else console.warn('! Policy Public tidak ditemukan — set manual: Settings → Access Policies → Public → Files → Read');

// ── E4. Simpan token ke GitHub secret (via stdin; tidak tampil di layar) ───
if (token) {
  const gh = spawnSync('gh', ['secret', 'set', 'DIRECTUS_TOKEN', '--repo', REPO], { input: token, encoding: 'utf8' });
  if (gh.status === 0) console.log('✓ GitHub secret DIRECTUS_TOKEN tersimpan');
  else console.warn(`! Gagal set secret via gh (${(gh.stderr || gh.error?.message || '').trim()}). Set manual di GitHub.`);
}

// ── F. Flow "Rebuild website" (opsional) ──────────────────────────────────
if (!ghPat) {
  console.log('\n• GITHUB_DISPATCH_TOKEN tidak diset — Tahap F (rebuild otomatis) dilewati.');
} else {
  const opOptions = {
    method: 'POST',
    url: `https://api.github.com/repos/${REPO}/dispatches`,
    headers: [
      { header: 'Authorization', value: `Bearer ${ghPat}` },
      { header: 'Accept', value: 'application/vnd.github+json' },
      { header: 'User-Agent', value: 'directus-eri' },
    ],
    body: JSON.stringify({ event_type: 'directus-publish' }),
  };
  let flow = await first(`/flows?filter[name][_eq]=${q('Rebuild website')}&fields=id,operation&limit=1`);
  if (!flow) {
    flow = await api('POST', '/flows', {
      name: 'Rebuild website', icon: 'rocket_launch', color: '#23862A', status: 'active',
      trigger: 'event', accountability: 'all',
      options: { type: 'action', scope: ['items.create', 'items.update', 'items.delete'], collections: ['articles'] },
    });
    const op = await api('POST', '/operations', {
      flow: flow.id, type: 'request', name: 'Trigger GitHub Actions', key: 'trigger_github',
      position_x: 19, position_y: 1, options: opOptions,
    });
    await api('PATCH', `/flows/${flow.id}`, { operation: op.id });
    console.log('✓ Flow "Rebuild website" dibuat');
  } else {
    if (flow.operation) await api('PATCH', `/operations/${flow.operation}`, { options: opOptions });
    console.log('• Flow "Rebuild website" sudah ada — token GitHub diperbarui');
  }
  // Uji token GitHub langsung.
  const t = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ghPat}`, Accept: 'application/vnd.github+json', 'User-Agent': 'directus-eri' },
    body: JSON.stringify({ event_type: 'directus-publish' }),
  });
  console.log(t.status === 204
    ? '  ✓ Token GitHub valid — rebuild uji dipicu (cek tab Actions)'
    : `  ! Token GitHub ditolak (${t.status}) — cek izin "Contents: Read and write" untuk repo ${REPO}`);
}

console.log('\nSelesai.');
