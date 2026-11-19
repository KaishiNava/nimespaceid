# Nime Space

## Profile Studio update

Fitur profil:
- Avatar bulat dan berada di tengah.
- Edit nama, bio, foto profil, banner, dan border avatar.
- Mendukung gambar PNG, JPG, WEBP, GIF (maksimum 8 MB per file).
- Level ditampilkan sebagai angka, emblem rank, dan animasi khusus BLACK HOLE.
- Rank visual: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, MYTHIC, BLACK HOLE.
- Admin Studio untuk menambahkan banner/border dari file upload atau URL, mengatur rarity dan akses role, serta mengubah role member.
- Admin dapat mengambil daftar file dari folder `banner/` dan `border/` pada repository https://github.com/KaishiNava/nime-space-assets.

## Wajib dilakukan setelah update

1. Buka Supabase Dashboard → SQL Editor.
2. Jalankan seluruh `supabase/schema.sql` (aman untuk schema awal dan menambahkan kolom/tabel yang belum ada).
3. Pastikan akun owner/admin sudah diberi role melalui SQL tepercaya. Contoh:

```sql
update public.profiles
set role = 'owner', role_label = 'Wibu Sepuh'
where username = 'USERNAME_OWNER';
```

4. Deploy ulang aplikasi.
5. Masuk ke `/profile`, lalu gunakan **Edit Profile**. Akun admin/owner akan melihat **Admin Studio**.

## Storage

SQL membuat bucket publik `profile-assets` dengan batas file 8 MB dan tipe gambar yang diizinkan. Kebijakan upload hanya mengizinkan user mengunggah ke folder UUID miliknya sendiri. Asset profil yang sudah diupload ditampilkan melalui public URL.

## Asset repository

File dalam folder `banner/` dan `border/` pada repository publik akan ditemukan otomatis melalui GitHub API. Tambahkan asset melalui Admin Studio untuk memasukkannya ke katalog Supabase. File GIF akan tetap bergerak ketika digunakan sebagai banner/border.

## Security notes

- Role dan label role tidak bisa diubah dari form profil biasa.
- Perubahan role dilakukan lewat RPC `admin_set_member_role` yang memeriksa role admin/owner di database.
- Hanya owner yang dapat memberikan role owner.
- Upload dibatasi pada folder user yang sedang login.
- Untuk asset katalog, hanya admin/owner yang dapat insert/update/delete.
