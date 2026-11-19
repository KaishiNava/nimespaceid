# Nime Space Profile Studio v7

## Perubahan
- Avatar benar-benar bulat dengan clipping terpisah dari overlay border.
- Border diposisikan di atas avatar dan ukurannya mengikuti frame, bukan menggeser gambar.
- Tombol Edit Profile, Admin Studio, dan Sign out dipindahkan ke toolbar bagian atas banner.
- Kartu level diringkas menjadi `LVL 1` (angka mengikuti nilai level dari database), dengan role chip di sampingnya.
- Role Wibu Sepuh/owner menampilkan `∞ UNLIMITED` tepat di bawah nama.
- Upload avatar menggunakan Supabase Storage bucket `profile-assets`.
- Avatar GIF diaktifkan hanya untuk Wibu Nolep dan Wibu Sepuh. Role lain menerima PNG/JPG/WEBP.
- Banner dan border tetap mengambil file dari GitHub; metadata tetap di Supabase.

## SQL wajib
Jalankan `supabase/profile_studio_fix.sql` melalui Supabase Dashboard > SQL Editor.
SQL ini memastikan kolom avatar, izin update profil sendiri, bucket `profile-assets`, dan storage policies.

## Deploy
1. Pastikan environment Supabase tetap terpasang di Vercel.
2. Jalankan SQL di atas.
3. Commit/push source dan deploy ulang.

Avatar maksimum 8 MB. Upload baru akan disimpan di folder berdasarkan UUID user. GIF dipertahankan sebagai GIF animasi.
