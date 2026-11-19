-- NIME SPACE Profile Studio fix v7
-- Jalankan di Supabase SQL Editor setelah schema.sql / profile_assets_github.sql.
-- Avatar disimpan di Supabase Storage. Banner dan border tetap memakai URL GitHub.

-- Pastikan kolom profil tersedia dan user boleh mengubah data profil miliknya.
alter table public.profiles add column if not exists role_label text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists banner_asset_id uuid;
alter table public.profiles add column if not exists border_asset_id uuid;

grant select on public.profiles to authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (display_name, bio, avatar_url, banner_asset_id, border_asset_id)
  on public.profiles to authenticated;

drop policy if exists "Users can update own profile basics" on public.profiles;
create policy "Users can update own profile basics"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Bucket publik agar foto profil dapat ditampilkan di halaman profil.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-assets',
  'profile-assets',
  true,
  8388608,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = excluded.allowed_mime_types;

-- File hanya boleh diunggah/diperbarui oleh pemilik folder: <auth.uid()>/...
drop policy if exists "Profile assets public read" on storage.objects;
create policy "Profile assets public read"
  on storage.objects for select
  using (bucket_id = 'profile-assets');

drop policy if exists "Users upload own profile assets" on storage.objects;
create policy "Users upload own profile assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own profile assets" on storage.objects;
create policy "Users update own profile assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own profile assets" on storage.objects;
create policy "Users delete own profile assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';
