# Dashboard Program Kusta — Kabupaten Karawang

Dashboard web untuk surveilans Program Kusta Kabupaten Karawang, Jawa Barat.
Menggantikan versi Looker Studio dengan satu halaman web yang bisa dibagikan
lewat tautan dan **diperbarui otomatis** dari Google Sheets.

Isi: 6 tab — Ringkasan, Perbandingan puskesmas, Peta sebaran, Data per
puskesmas, Status eliminasi, dan Puskesmas intervensi (dengan sub-halaman
Ringkasan intervensi, Indikator DESAKU, Indikator KOTAKU, Peta per desa).

---

## Cara kerjanya (penting: soal privasi)

Model yang dipakai: **agregat saja, refresh terjadwal.**

```
Google Sheets (data mentah)  ──►  build.py  ──►  data.json (hanya agregat)  ──►  dashboard web
        (privat)                 (GitHub Action,            (yang diterbitkan)
                                  terjadwal)
```

- `build.py` membaca 6 sheet, lalu menghitung **angka agregat** (jumlah kasus
  per puskesmas/periode, dsb) dan menuliskannya ke `data.json`.
- **Line-list mentah (data per pasien) tidak pernah ikut ke `data.json`.** Jadi
  yang terbuka di web hanya angka ringkasan — tanggal, umur, dan detail per
  pasien tetap tinggal di Google Sheets.
- GitHub Action menjalankan `build.py` sesuai jadwal, lalu menerbitkan ulang
  halaman. Jadi begitu Sheets diperbarui, dashboard ikut berubah pada jadwal
  berikutnya tanpa perlu utak-atik kode.

> Catatan: untuk sekarang halaman web bersifat publik (siapa pun yang punya
> tautan bisa melihat angka agregat). Kalau perlu dikunci hanya untuk pegawai,
> lihat bagian **Membatasi akses** di bawah.

---

## Berkas di dalam folder ini

| Berkas | Fungsi |
|---|---|
| `index.html` | Kerangka halaman |
| `styles.css` | Gaya tampilan |
| `app.js` | Logika dashboard (membaca `data.json`, merender semua tab) |
| `build.py` | Menarik data dari Sheets → menghitung agregat → `data.json` |
| `data.json` | Hasil agregat (dibuat ulang tiap refresh) |
| `vendor/` | Pustaka peta Leaflet (disertakan, tanpa CDN) |
| `.github/workflows/refresh.yml` | Jadwal refresh + penerbitan otomatis |

---

## Pasang di GitHub Pages (gratis)

### 1. Siapkan Google Sheets
Agar `build.py` bisa membaca sheet tanpa login:
1. Buka spreadsheet → **Share / Bagikan**.
2. Ubah **General access** menjadi **Anyone with the link → Viewer**.
3. Pastikan nama tab persis: `register_anonim`, `penduduk`, `data_indikator`,
   `periode`, `cek_data`, `puskesmas`.

### 2. Buat repo & unggah berkas
1. Buat repository baru di GitHub (boleh **Private** — Pages tetap bisa).
2. Unggah seluruh isi folder ini (termasuk folder `vendor/` dan `.github/`).

### 3. Nyalakan GitHub Pages
1. Repo → **Settings → Pages**.
2. **Source** pilih **GitHub Actions**.

### 4. Jalankan pertama kali
1. Repo → tab **Actions** → pilih workflow *"Perbarui & terbitkan dashboard"*
   → **Run workflow**.
2. Setelah selesai (hijau), tautan dashboard muncul di **Settings → Pages**,
   berbentuk `https://<username>.github.io/<nama-repo>/`.
3. Bagikan tautan itu ke pegawai.

Setelah ini, dashboard akan **refresh otomatis setiap hari** sesuai jadwal.

---

## Mengatur ID sheet lewat GitHub (opsional)

`build.py` sudah memuat ID sheet bawaan. Kalau ID sheet berganti, tidak perlu
mengubah kode:
- Repo → **Settings → Secrets and variables → Actions → Variables → New
  variable**, nama `SHEET_ID`, isi dengan ID sheet yang baru.

(ID sheet adalah bagian URL di antara `/d/` dan `/edit`.)

---

## Mengubah jadwal refresh

Edit baris `cron` di `.github/workflows/refresh.yml`:

| Jadwal | cron |
|---|---|
| Tiap hari 05:00 WIB (bawaan) | `0 22 * * *` |
| Tiap jam | `0 * * * *` |
| Tiap 6 jam | `0 */6 * * *` |
| Tiap Senin 05:00 WIB | `0 22 * * 1` |

Waktu cron memakai UTC (WIB = UTC+7). Kamu juga selalu bisa menekan **Run
workflow** untuk refresh manual kapan saja.

---

## Mengembangkan / menguji di komputer sendiri

Tidak perlu memasang paket apa pun (hanya Python 3).

```bash
# 1. Buat data.json dari ekspor gabungan (untuk uji coba tanpa internet)
python build.py --local Data_Karawang

# atau tarik langsung dari Google Sheets:
python build.py

# 2. Jalankan server lokal, lalu buka http://localhost:8000
python -m http.server 8000
```

> Membuka `index.html` langsung lewat `file://` tidak akan jalan — dashboard
> memuat `data.json` lewat `fetch`, jadi harus lewat server (langkah 2).

---

## Mengaktifkan "Peta per desa"

Halaman ini sengaja dibiarkan kosong karena register SIPK belum punya kolom
desa. Untuk mengaktifkannya nanti:
1. Tambahkan kolom **desa** pada `register_anonim`, dan satu sheet koordinat
   desa (nama desa + lintang + bujur) untuk 20 puskesmas intervensi.
2. Lanjutkan di `build.py` (bagian agregat) dan `app.js` (fungsi `subPetaDesa`).

Ingat: pada desa dengan 1–2 kasus, pasien bisa dikenali warga. Jika peta per
desa diaktifkan, sebaiknya halaman itu dikunci hanya untuk tim program (lihat
di bawah), bukan tautan publik.

---

## Membatasi akses (jika perlu hanya untuk pegawai)

Model ini hanya menerbitkan angka agregat, jadi relatif aman dibagikan. Tapi
kalau tetap ingin dikunci:
- **Cloudflare Pages + Cloudflare Access**: host di Cloudflare Pages (cara
  serupa), lalu pasang Cloudflare Access untuk membatasi ke email/domain
  tertentu (gratis sampai 50 pengguna).
- **Netlify**: fitur password/Identity untuk mengunci situs.
- Untuk GitHub Pages pada repo privat, halaman Pages tetap publik — jadi untuk
  penguncian gunakan salah satu opsi di atas.

---

## Sumber & catatan

- Sumber data: register SIPK Karawang dan Laporan Triwulan Bina Desa/Kota
  Sahabat Kusta, diinput oleh tim program.
- Semua angka di dashboard bersifat anonim (tanpa nama/alamat pasien).
- Batas <5% dan target 80% / 90% mengikuti dashboard program kusta Jawa Timur;
  kriteria fase eliminasi mengikuti *Leprosy Elimination Monitoring Tool* (WHO).
- RFT dihitung dari kohort kasus MB yang registrasinya dua tahun sebelum tahun
  terpilih (mis. untuk 2026 → kohort 2024).
- Beberapa kualitas data yang perlu dicek sudah ditandai di sheet `cek_data`.
