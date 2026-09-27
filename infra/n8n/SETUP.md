# Setup n8n: artikel via Telegram (Fase 3)

Alur: kirim ide ke bot Telegram → n8n → **Claude API** menyusun draft (ID + EN) →
tersimpan sebagai **draft** di Directus → pratinjau di Telegram dengan tombol
**Publish / Revisi / Batal** → Publish → Directus memicu rebuild → tayang ±3 menit.

n8n berjalan di server Lightsail yang sama dengan Directus (compose yang sama),
di **https://n8n.enviroresources.co.id**. Perintah **[server]** dijalankan lewat SSH
Lightsail di folder `~/directus`; **[laptop]** di terminal VS Code (PowerShell, folder repo).

---

## A. Tiga kunci yang perlu disiapkan

1. **Bot Telegram** — chat ke **@BotFather** → `/newbot` → beri nama (mis. `ERI Artikel`)
   dan username (harus diakhiri `bot`, mis. `eri_artikel_bot`). Salin **token** (`123456:ABC…`).
2. **API key Anthropic** — https://console.anthropic.com → API Keys → Create Key. Salin (`sk-ant-…`).
   Isi saldo/credit secukupnya (satu artikel ±Rp 3–6 ribu).
3. **Token tulis Directus** **[laptop]** — buat user "Telegram Bot" (hanya boleh kelola artikel):
   ```powershell
   $env:DIRECTUS_URL='https://cms.enviroresources.co.id'
   $env:ADMIN_EMAIL='info@enviroresources.co.id'
   $env:ADMIN_PASSWORD='PASSWORD_ADMIN'
   node infra/n8n/setup-writer.mjs
   Remove-Item Env:ADMIN_PASSWORD
   ```
   Terminal mencetak `DIRECTUS_WRITER_TOKEN=…` sekali. Salin.

## B. DNS

hPanel → Domains → `enviroresources.co.id` → DNS record → tambah:
`A` · Nama `n8n` · Value **13.251.135.32** (IP static Lightsail) · TTL 300.

## C. Server **[server]**

```bash
cd ~/directus
# 1) tambahkan kunci ke .env  (ganti nilai di dalam tanda kutip)
cat >> .env <<EOF
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
TELEGRAM_BOT_TOKEN='TOKEN_BOTFATHER'
ANTHROPIC_API_KEY='sk-ant-...'
DIRECTUS_WRITER_TOKEN='TOKEN_DARI_LANGKAH_A3'
EOF
nano .env   # cek 4 baris terakhir, isi nilainya, Ctrl+O Enter Ctrl+X
```

Perbarui `docker-compose.yml` dan `Caddyfile` dengan versi terbaru dari repo
(`infra/directus/`): salin isinya lewat `nano`, atau `scp`. Lalu:

```bash
docker compose pull n8n && docker compose up -d && docker compose ps
```

Buka **https://n8n.enviroresources.co.id** → buat akun owner (email + password;
ini login n8n, simpan baik-baik).

## D. Buat & impor workflow **[laptop]**

Bot hanya melayani ID Telegram yang diizinkan. Cara tahu ID-mu: nanti kirim `/start`
ke bot, bot membalas dengan ID-mu. Untuk sekarang buat workflow dulu (ID bisa diisi belakangan):

```powershell
node infra/n8n/build-workflow.mjs 123456789,987654321   # ID Telegram, pisahkan koma
```

Hasil: `infra/n8n/out/eri-telegram-articles.json` + di terminal muncul **alamat webhook**
dan **perintah setWebhook**. Keduanya rahasia (jangan kirim ke chat).

Di n8n: menu **⋯** (kanan atas) → **Import from File** → pilih file JSON itu → **Save** →
tombol **Active** (kanan atas) → aktif. Kalau ID belum diisi, buka node **Router** dan edit
baris `const ALLOWED = [...]`.

## E. Daftarkan webhook ke Telegram **[server]**

Jalankan perintah `setWebhook` yang dicetak langkah D (di `~/directus`). Balasan yang benar:
`{"ok":true,"result":true,"description":"Webhook was set"}`.

## F. Uji

1. Kirim `/start` ke bot → bot membalas panduan + ID Telegram-mu (kalau belum diizinkan,
   masukkan ID itu ke node Router lalu Save).
2. Kirim ide, mis. *"Kapan usaha butuh UKL-UPL vs SPPL, untuk pemilik pabrik kecil."*
3. ±1–2 menit: pratinjau + tombol. **Revisi** → balas pesan bot dengan catatan.
   **Publish** → artikel tayang ±3 menit di enviroresources.co.id/id/articles/.

## Catatan

- Draft yang dibatalkan dihapus dari CMS; draft yang belum diputuskan tetap tersimpan
  berstatus *draft* (bisa dibuka di cms.enviroresources.co.id).
- Mengganti bot/API key: ubah `.env` → `docker compose up -d n8n`.
- Log: `docker compose logs -f n8n`. Riwayat eksekusi: n8n → Executions.
- Model: `claude-opus-5`, keluaran JSON terstruktur (`output_config.format`), fallback
  server-side aktif (`fallbacks: "default"`) bila permintaan ditolak pengaman.
