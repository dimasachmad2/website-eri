# Setup Directus di Lightsail (Fase 2)

Target: **https://cms.enviroresources.co.id** (Directus + Postgres, HTTPS otomatis via Caddy)
di instance Lightsail **1 GB, Ubuntu**. Semua perintah dijalankan **di server** lewat SSH
(atau tombol "Connect using SSH" di console Lightsail), kecuali yang ditandai **[laptop]**.

Alur besar: A) siapkan jaringan → B) siapkan server → C) nyalakan Directus → D) buat koleksi →
E) token untuk build situs → F) pemicu rebuild saat publish → G) uji.

---

## A. Jaringan (console Lightsail + DNS Hostinger)

1. **Static IP** — Lightsail → Networking → *Create static IP* → attach ke instance. Catat IP-nya.
2. **Firewall** instance → Networking → IPv4 Firewall, pastikan ada: **SSH 22**, **HTTP 80**, **HTTPS 443**.
3. **DNS** — hPanel Hostinger → Domains → `enviroresources.co.id` → DNS record → **Tambah**:
   - Tipe `A`, Nama `cms`, Value `<static IP Lightsail>`, TTL 300.
   Tunggu ±5–15 menit. Cek dari laptop: `nslookup cms.enviroresources.co.id` harus menjawab IP itu.

## B. Siapkan server (sekali saja)

```bash
# 1) Swap 2 GB — wajib untuk RAM 1 GB
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # harus terlihat Swap: 2.0Gi

# 2) Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# keluar lalu masuk SSH lagi supaya grup docker aktif, lalu cek:
docker compose version
```

## C. Nyalakan Directus

```bash
mkdir -p ~/directus && cd ~/directus
```

Buat **3 file** di folder ini dengan isi persis dari repo `infra/directus/`:
`docker-compose.yml`, `Caddyfile`, dan `.env` (salin dari `.env.example`).
Cara termudah: buka file di repo, lalu di server `nano nama-file`, tempel, simpan (Ctrl+O, Enter, Ctrl+X).

Isi `.env`:

```bash
# buat 2 nilai acak untuk KEY dan SECRET
openssl rand -hex 32
openssl rand -hex 32
nano .env   # isi KEY, SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, DB_PASSWORD
```

Jalankan:

```bash
docker compose up -d
docker compose logs -f directus   # tunggu sampai muncul "Server started" (Ctrl+C untuk keluar)
```

Buka **https://cms.enviroresources.co.id** → login dengan ADMIN_EMAIL / ADMIN_PASSWORD.
(Caddy mengurus sertifikat HTTPS otomatis; butuh DNS di langkah A sudah aktif.)

## D. Buat koleksi `articles` **[laptop]**

Dari folder repo di laptop (Node sudah ada):

```powershell
$env:DIRECTUS_URL="https://cms.enviroresources.co.id"
$env:ADMIN_EMAIL="admin@enviroresources.co.id"
$env:ADMIN_PASSWORD="<password admin>"
node infra/directus/create-articles.mjs
```

Hasil: koleksi **Articles** dengan field status, tanggal tayang, slug, kategori, cover,
judul/ringkasan/isi (ID + EN). Cek di Directus → Content → Articles.

Lalu di Directus → **Settings → Access Control → Policies → Public** → Permissions →
`directus_files` → **Read: All**. (Supaya gambar yang disisipkan di isi artikel bisa tampil.)

## E. Token untuk build situs (read-only)

Di Directus:
1. **Settings → Access Control → Policies → +** : nama `Reader`. Permissions: `articles` → Read: All; `directus_files` → Read: All. Save.
2. **Roles → +** : nama `Reader`, tambahkan policy `Reader`. Save.
3. **User Directory → +** : nama `Build Bot`, role `Reader`, status Active. Di bagian **Token** → *Generate* → **salin** token → Save.
4. **[laptop] GitHub** → repo `website-eri` → Settings → Secrets and variables → Actions → tambah:
   - `DIRECTUS_URL` = `https://cms.enviroresources.co.id`
   - `DIRECTUS_TOKEN` = token Build Bot

## F. Rebuild otomatis saat artikel di-publish

1. **[laptop] GitHub** → Settings (profil) → Developer settings → Personal access tokens →
   **Fine-grained** → Generate: Repository access = *Only* `website-eri`; Permissions →
   **Contents: Read and write**. Salin token (diawali `github_pat_`).
2. Di Directus → **Settings → Flows → +**:
   - Name `Rebuild website`, Status Active, Trigger **Event Hook**, Type **Action (Non-Blocking)**,
     Scope: `items.create`, `items.update`; Collections: `articles`. Save.
   - Tambah Operation **Webhook / Request URL**:
     - Method `POST`
     - URL `https://api.github.com/repos/dimasachmad2/website-eri/dispatches`
     - Headers: `Authorization` = `Bearer github_pat_...`, `Accept` = `application/vnd.github+json`
     - Request Body: `{"event_type":"directus-publish"}`
   - Save.

Setiap artikel disimpan/publish → GitHub Actions build ulang situs → upload FTP (±3 menit).

## G. Uji

1. Directus → Content → Articles → **+** : isi judul ID/EN, slug (mis. `uji-artikel-pertama`),
   kategori, cover, isi; status **Published**; tanggal tayang; Save.
2. GitHub → Actions → harus muncul run baru (trigger `repository_dispatch`).
3. Setelah hijau: buka `https://enviroresources.co.id/id/articles/` dan
   `https://enviroresources.co.id/id/articles/uji-artikel-pertama/`.

## Operasional

- Update Directus: `cd ~/directus && docker compose pull && docker compose up -d`
- Backup DB: `docker compose exec db pg_dump -U directus directus | gzip > backup-$(date +%F).sql.gz`
- Log: `docker compose logs -f directus`
- Pindah server: salin `.env`, `docker-compose.yml`, `Caddyfile`, hasil `pg_dump`, dan volume
  `directus_uploads` → `docker compose up -d` di server baru → arahkan DNS `cms`.
