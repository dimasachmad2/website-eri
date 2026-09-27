// Membuat akses TULIS untuk bot Telegram (idempotent):
//   policy+role "Writer" (articles: create/read/update/delete) dan user "Telegram Bot".
// Token dicetak SEKALI di terminal — salin ke .env server sebagai DIRECTUS_WRITER_TOKEN.
// Set REGENERATE=1 untuk membuat token baru (token lama langsung tidak berlaku).
//
//   $env:DIRECTUS_URL="https://cms.enviroresources.co.id"
//   $env:ADMIN_EMAIL="info@enviroresources.co.id"
//   $env:ADMIN_PASSWORD='...'
//   node infra/n8n/setup-writer.mjs
import { randomBytes } from 'node:crypto';

const url = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, REGENERATE } = process.env;
if (!url || !email || !password) {
  console.error('Set DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD dulu.');
  process.exit(1);
}

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

// Policy "Writer"
let policy = await first(`/policies?filter[name][_eq]=Writer&limit=1`);
if (!policy) {
  policy = await api('POST', '/policies', {
    name: 'Writer', icon: 'edit_note', description: 'Bot Telegram: kelola artikel',
    admin_access: false, app_access: false,
  });
  console.log('✓ Policy Writer dibuat');
} else console.log('• Policy Writer sudah ada');

for (const action of ['create', 'read', 'update', 'delete']) {
  const has = await first(
    `/permissions?filter[policy][_eq]=${policy.id}&filter[collection][_eq]=articles&filter[action][_eq]=${action}&limit=1`,
  );
  if (!has) {
    await api('POST', '/permissions', { policy: policy.id, collection: 'articles', action, fields: ['*'], permissions: {} });
    console.log(`  ✓ Writer boleh ${action} articles`);
  }
}

// Role "Writer"
let role = await first(`/roles?filter[name][_eq]=Writer&limit=1`);
if (!role) {
  role = await api('POST', '/roles', { name: 'Writer', icon: 'edit_note', policies: { create: [{ policy: policy.id }] } });
  console.log('✓ Role Writer dibuat');
} else console.log('• Role Writer sudah ada');

// User "Telegram Bot" + token
let bot = await first(`/users?filter[first_name][_eq]=${q('Telegram Bot')}&fields=id,token&limit=1`);
let token = null;
if (!bot) {
  token = randomBytes(32).toString('hex');
  bot = await api('POST', '/users', { first_name: 'Telegram Bot', role: role.id, status: 'active', token });
  console.log('✓ User Telegram Bot dibuat');
} else if (!bot.token || REGENERATE === '1') {
  token = randomBytes(32).toString('hex');
  await api('PATCH', `/users/${bot.id}`, { token });
  console.log('✓ Token Telegram Bot dibuat ulang');
} else {
  console.log('• User Telegram Bot sudah punya token (tidak ditampilkan). Jalankan dengan REGENERATE=1 bila perlu token baru.');
}

if (token) {
  await api('GET', '/items/articles?limit=1', null, token);
  console.log('  ✓ Token bisa mengakses articles');
  console.log('\nSalin baris ini ke .env di server (~/directus/.env), JANGAN kirim ke chat:\n');
  console.log(`DIRECTUS_WRITER_TOKEN=${token}\n`);
}
console.log('Selesai.');
