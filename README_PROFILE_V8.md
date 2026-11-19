# Nime Space Profile Studio v8

## Perubahan v8
- Badge `∞ UNLIMITED` dan role sekarang sejajar di bawah nama; role tidak lagi berada di kartu level.
- Badge role/Unlimited memakai efek black-hole hitam dengan glow dan putaran cahaya yang halus.
- Kartu level mendapat efek glow gelap yang bergerak.
- Border avatar diperbesar dan dipusatkan tanpa mengubah crop foto profil.
- Edit Profile dan Admin Studio tampil sebagai modal overlay di tengah layar, bukan panel panjang di bagian bawah profil.
- Upload banner/border menampilkan status proses dan error yang lebih jelas.
- Endpoint GitHub memvalidasi sesi dan role admin/owner, format/ukuran file, serta memberi pesan spesifik untuk token, izin, repo, dan branch.
- Setelah upload GitHub sukses, metadata dimasukkan ke Supabase dan katalog langsung diperbarui.
- GIF diunggah sebagai GIF asli.

## Environment Variables Vercel
Pastikan tersedia:
- `GITHUB_TOKEN` — Fine-grained token dengan akses ke repository asset dan permission **Contents: Read and write**.
- `GITHUB_ASSETS_OWNER` — default `KaishiNava`.
- `GITHUB_ASSETS_REPO` — default `nime-space-assets`.
- `GITHUB_ASSETS_BRANCH` — default `main`.
- Variabel Supabase yang sudah dipakai project sebelumnya.

Jangan pernah menaruh token GitHub di kode frontend atau mengirimkannya ke browser. Tambahkan token hanya pada Vercel Project Settings → Environment Variables, lalu redeploy.

## SQL
Gunakan SQL yang sudah disediakan:
1. `supabase/profile_assets_github.sql`
2. `supabase/profile_studio_fix.sql`

Jalankan sesuai urutan bila database belum menerapkannya. Jangan menghapus tabel/profil yang sudah ada.

## Jika upload masih gagal
Versi ini akan menampilkan pesan asli dari GitHub atau Supabase. Arti umum:
- HTTP 401: token tidak valid/kedaluwarsa.
- HTTP 403: token tidak memiliki izin Contents: Read and write atau terkena rate limit.
- HTTP 404: owner/repository/branch salah atau tidak ditemukan.
- Pesan `metadata Supabase gagal`: file sudah berhasil masuk GitHub, tetapi insert katalog ditolak Supabase; periksa SQL/RLS tabel `banner_assets` atau `border_assets`.

Ukuran file maksimum 10 MB. Format PNG, JPG, WEBP, dan GIF didukung.
