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


## Konfigurasi pemutar streaming

Halaman `/watch/[id]` mengambil URL episode terbaru tanpa cache agar URL stream yang memiliki masa berlaku tidak tersimpan selama 180 detik. Pemutar mendukung MP4/WebM langsung, HLS (`.m3u8`) melalui HLS.js atau native HLS browser, dan URL embed.

Untuk mengaktifkan sumber video yang memang Anda miliki atau telah mendapat izin distribusinya, atur Environment Variables di hosting:

- `STREAMING_RIGHTS_CONFIRMED=true`
- `OMNIFY_ALLOWED_STREAM_HOSTS=anime.omnifylabs.sbs` (hanya jika URL video memang berasal dari host ini dan penyedia mengizinkannya)

Isi daftar host dengan hostname yang benar-benar muncul pada URL sumber video dan telah disetujui pemilik konten. Jangan isi dengan domain API kecuali video memang disajikan dari domain tersebut. Jangan gunakan wildcard atau menghapus pemeriksaan host. Setelah mengubah Environment Variables, lakukan redeploy.

Jika player masih menampilkan pesan sumber belum bisa diputar, buka **Diagnostik respons API** pada halaman watch. Bagian `detectedHosts` menampilkan hostname yang ditemukan tanpa membocorkan URL bertoken. Pastikan host yang terdeteksi sudah diverifikasi dan ditambahkan ke `OMNIFY_ALLOWED_STREAM_HOSTS`. Jika `detectedHosts` kosong, periksa bentuk respons endpoint episode dan `episodeId` yang dikirim dari daftar episode.

Catatan teknis:
- Untuk MP4/WebM, atribut `crossOrigin` sengaja tidak dipaksakan karena dapat membuat server media tanpa header CORS menolak pemutaran biasa.
- HLS lintas-domain tetap membutuhkan CORS yang benar pada playlist `.m3u8` dan setiap segmen dari server media; player browser tidak dapat memperbaiki CORS yang ditolak server.
- URL embed harus mengizinkan iframe dari domain website Anda.
- Jangan menaruh `OMNIFY_API_KEY` di variabel `NEXT_PUBLIC_*`, kode client, atau repository.
- Endpoint beranda API saat ini menampilkan informasi API key secara publik. Minta penyedia untuk mencabut/memutar ulang key tersebut dan gunakan key baru sebagai secret server-side sebelum deploy.

### Format respons stream OmnifyAnime 1.3

Endpoint `/anime/episode?id=...` dapat mengembalikan `data.streams[]` dengan properti `server`, `quality`, `stream_url`, dan `format`. Aplikasi membaca `stream_url` dan menentukan pemutar dari `format` (`mp4` atau `hls`). Jika server utama gagal, player otomatis mencoba sumber berikutnya; pengguna juga dapat memilih server secara manual. URL `/proxy/stream/...` merupakan URL media bertoken dari penyedia, bukan endpoint API episode.

Untuk HLS melalui hls.js, penyedia harus mengizinkan CORS pada playlist, segmen, dan key (jika ada). Mengubah konfigurasi CORS di aplikasi Nime Space tidak dapat mengubah header yang dikirim server media.


### Omnify MP4 stream relay (v8.7)

MP4 URLs shaped as `https://<allowed-host>/proxy/stream/<opaque-token>` are played through the same-origin `/api/stream/<token>` route. The route validates the configured host and rights flag, forwards `Range` / `If-Range`, and preserves upstream status and media headers (including `206 Partial Content`). It does not accept arbitrary URLs and does not bypass DRM or provider access controls. HLS sources remain on the HLS.js/native HLS path.
