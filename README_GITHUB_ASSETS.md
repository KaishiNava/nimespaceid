# Nime Space: penyimpanan aset profil

## Pemisahan penyimpanan
- **Avatar/foto profil:** file di Supabase Storage bucket `profile-assets`; URL dan data profil disimpan di tabel `profiles`.
- **Banner dan border koleksi:** file di GitHub repository `KaishiNava/nime-space-assets` pada folder `banner/` atau `border/`. Metadata (nama, URL, rarity, role akses, status aktif) disimpan di tabel `banner_assets` / `border_assets` Supabase.

## Environment Variables Vercel
Tambahkan pada Project Settings → Environment Variables:

- `GITHUB_TOKEN` = fine-grained Personal Access Token. Batasi hanya ke repository `KaishiNava/nime-space-assets`, dengan **Contents: Read and write**.
- `GITHUB_ASSETS_OWNER` = `KaishiNava`
- `GITHUB_ASSETS_REPO` = `nime-space-assets`
- `GITHUB_ASSETS_BRANCH` = `main`

Jangan beri prefix `NEXT_PUBLIC_` pada token. Jangan masukkan token ke source code atau kirim token ke browser. Setelah menambah/mengubah env, lakukan redeploy.

## SQL Supabase
Jalankan `supabase/profile_assets_github.sql` di SQL Editor. File ini menambahkan kolom profil, tabel katalog, RLS, RPC role admin, grants, dan meminta PostgREST reload schema.

Jika belum ada admin, jalankan sekali dengan UUID akun pemilik dari Authentication → Users:

```sql
update public.profiles
set role = 'owner', role_label = 'Wibu Sepuh'
where id = 'UUID-AKUN-PEMILIK';
```

Ganti placeholder dengan UUID milik akun sendiri. Jangan publikasikan UUID atau token.

## Cara kerja
1. Admin/owner memilih Banner atau Border, mengisi nama, rarity, akses role, dan memilih file PNG/JPG/WEBP/GIF.
2. Browser mengirim file ke `/api/admin/github-assets` menggunakan sesi login.
3. Route server memverifikasi sesi dan role admin/owner, lalu mengunggah file ke GitHub menggunakan `GITHUB_TOKEN`.
4. URL GitHub dan metadata aset dicatat di Supabase.
5. Saat Edit Profile, avatar diunggah ke Supabase Storage. Banner dan border dipilih dari katalog GitHub; perubahan pilihan disimpan ke kolom `banner_asset_id` / `border_asset_id` di Supabase.

Batas upload banner/border: 10 MB per file. Avatar: 8 MB.


## Jika upload gagal
Pesan upload sekarang ditampilkan langsung di dalam modal Admin Studio. Periksa teks error tersebut:
- `GITHUB_TOKEN belum dipasang`: tambahkan Environment Variable bernama persis `GITHUB_TOKEN` di Vercel untuk Production (dan Preview jika dipakai), lalu redeploy.
- `401`: token tidak valid/kedaluwarsa.
- `403`: token tidak diberi izin **Contents: Read and write**, atau akses repository belum dipilih pada fine-grained token.
- `404`: owner, nama repository, atau branch salah; pastikan `KaishiNava`, `nime-space-assets`, dan `main`.
- `Akses khusus admin/owner`: kolom `profiles.role` akun yang login harus `admin` atau `owner`; label tampilan saja tidak cukup.

Token hanya disimpan di Vercel sebagai variable server-side. Jangan pernah mengirim token lewat chat atau memasukkannya ke `NEXT_PUBLIC_...`.
