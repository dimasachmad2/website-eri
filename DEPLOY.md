# Deploy ke Hostinger

Ada dua cara. **Cara A dipakai sekarang** (Fase 1, situs statis). Cara B untuk nanti
(Fase 2, saat butuh server untuk Directus/ISR).

---

## Cara A — GitHub Actions + FTP (statis, repo tetap PRIVATE) ✅ aktif

Alur: setiap `git push` ke `main` → GitHub Actions build export statis → upload
folder `out/` ke Hostinger via **FTPS**. Tidak butuh koneksi GitHub App Hostinger,
repo tetap privat. Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Yang perlu kamu isi: 4 GitHub Secret

Di GitHub: **repo `website-eri` → Settings → Secrets and variables → Actions → New repository secret.** Buat 4 ini:

| Nama secret       | Isi                                                                 |
| ----------------- | ------------------------------------------------------------------- |
| `FTP_SERVER`      | Host FTP dari hPanel (mis. `ftp.envirors.id` atau IP server)        |
| `FTP_USERNAME`    | Username FTP                                                         |
| `FTP_PASSWORD`    | Password FTP                                                         |
| `FTP_REMOTE_DIR`  | Folder web root, biasanya `/public_html/` (domain utama)            |

**Ambil kredensial FTP:** hPanel → **Files → FTP Accounts** (lihat/atur host, username, password).

### Menjalankan

- Otomatis tiap `git push` ke `main`, atau
- Manual: tab **Actions → "Deploy ke Hostinger (statis via FTP)" → Run workflow**.

Sebelum secret diisi, run tetap sukses (build) tapi upload dilewati (ada warning).

### Catatan

- Kalau file mendarat di folder salah, sesuaikan `FTP_REMOTE_DIR` (mis. domain add-on
  pakai path lain seperti `/domains/namadomain/public_html/`).
- Kalau FTPS gagal handshake, ganti `protocol: ftps` → `ftp` di workflow (kurang aman).
- Root `/` diarahkan ke `/id/` lewat `out/index.html` (dibuat `scripts/gen-root-redirect.mjs`).

---

## Cara B — Managed Node.js (untuk Fase 2)

Saat Fase 2 (Directus/ISR butuh server Node), pindah ke sini. Build default sudah
`output: 'standalone'`.

| Field            | Nilai        |
| ---------------- | ------------ |
| Application type | `next`       |
| Build script     | `build`      |
| Output directory | `.next`      |
| Node version     | 20+          |

Langkah: hPanel → **Add Website → Deploy Web App → Import Git Repository** → pilih
`dimasachmad2/website-eri` → Deploy. (Butuh koneksi GitHub App Hostinger; kalau repo
tak muncul di daftar, disconnect–reconnect GitHub dari sisi hPanel.)

`next.config.mjs` sudah dukung dua mode: default `standalone`, dan `BUILD_STATIC=1`
untuk export statis (dipakai Cara A).
