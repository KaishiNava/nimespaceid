-- NIME SPACE: GitHub asset catalog + Supabase profile settings
-- Jalankan sekali di Supabase SQL Editor (aman dijalankan ulang).

-- 1) Kolom profil. Avatar, pilihan banner/border, nama dan bio disimpan di Supabase.
alter table public.profiles
  add column if not exists role_label text,
  add column if not exists custom_banner_url text,
  add column if not exists custom_border_url text,
  add column if not exists banner_asset_id uuid,
  add column if not exists border_asset_id uuid;

-- 2) Katalog metadata asset. File gambar aslinya disimpan di GitHub, bukan Storage Supabase.
create table if not exists public.banner_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  image_url text not null,
  github_path text,
  access_role text not null default 'all',
  rarity text not null default 'COMMON',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.border_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'common',
  image_url text not null,
  github_path text,
  access_role text not null default 'all',
  rarity text not null default 'COMMON',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.banner_assets add column if not exists rarity text not null default 'COMMON';
alter table public.banner_assets add column if not exists github_path text;
alter table public.banner_assets add column if not exists access_role text not null default 'all';
alter table public.border_assets add column if not exists rarity text not null default 'COMMON';
alter table public.border_assets add column if not exists github_path text;
alter table public.border_assets add column if not exists access_role text not null default 'all';

-- 3) Foreign key pilihan asset pada profil (jika belum ada).
do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_banner_asset_id_fkey') then
    alter table public.profiles add constraint profiles_banner_asset_id_fkey
      foreign key (banner_asset_id) references public.banner_assets(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_border_asset_id_fkey') then
    alter table public.profiles add constraint profiles_border_asset_id_fkey
      foreign key (border_asset_id) references public.border_assets(id) on delete set null;
  end if;
end $$;

-- 4) RLS katalog: semua user login hanya membaca asset aktif yang sesuai role.
alter table public.banner_assets enable row level security;
alter table public.border_assets enable row level security;
drop policy if exists "Active banners readable" on public.banner_assets;
drop policy if exists "Active borders readable" on public.border_assets;
drop policy if exists "Admins manage banners" on public.banner_assets;
drop policy if exists "Admins manage borders" on public.border_assets;
create policy "Active banners readable" on public.banner_assets
  for select to authenticated using (
    active = true and (
      access_role = 'all'
      or access_role = (select p.role from public.profiles p where p.id = auth.uid())
      or (access_role = 'admin' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner')))
    )
  );
create policy "Active borders readable" on public.border_assets
  for select to authenticated using (
    active = true and (
      access_role = 'all'
      or access_role = (select p.role from public.profiles p where p.id = auth.uid())
      or (access_role = 'admin' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner')))
    )
  );
create policy "Admins manage banners" on public.banner_assets
  for all to authenticated
  using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner')))
  with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner')));
create policy "Admins manage borders" on public.border_assets
  for all to authenticated
  using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner')))
  with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner')));

grant select on public.banner_assets, public.border_assets to authenticated;
grant insert, update, delete on public.banner_assets, public.border_assets to authenticated;

-- 5) User hanya boleh mengubah kolom profil kosmetik miliknya sendiri.
-- Role, level, EXP, public_id tidak pernah diberikan hak update dari browser.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, bio, avatar_url, banner_asset_id, border_asset_id)
  on public.profiles to authenticated;
drop policy if exists "Users can update own profile basics" on public.profiles;
create policy "Users can update own profile basics" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 6) Role management hanya melalui RPC dan admin/owner.
create or replace function public.admin_set_member_role(target_user_id uuid, new_role text, new_role_label text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','owner')) then
    raise exception 'Akses ditolak: admin only';
  end if;
  if new_role not in ('free','premium','admin','owner') then raise exception 'Role tidak valid'; end if;
  if new_role='owner' and not exists(select 1 from public.profiles where id=auth.uid() and role='owner') then
    raise exception 'Hanya owner yang dapat memberikan role owner';
  end if;
  if new_role_label not in ('Wibu Normal','Wibu Nolep','Wibu Sepuh','Wibu Nolep+','Wibu Legenda','Custom Member') then
    raise exception 'Label role tidak valid';
  end if;
  if exists(select 1 from public.profiles where id=target_user_id and role='owner')
     and not exists(select 1 from public.profiles where id=auth.uid() and role='owner') then
    raise exception 'Hanya owner yang dapat mengubah owner';
  end if;
  update public.profiles set role=new_role, role_label=new_role_label, updated_at=now() where id=target_user_id;
  if not found then raise exception 'Member tidak ditemukan'; end if;
end;
$$;
revoke all on function public.admin_set_member_role(uuid,text,text) from public;
grant execute on function public.admin_set_member_role(uuid,text,text) to authenticated;

-- Minta PostgREST memuat ulang metadata agar error schema cache tidak tertinggal.
notify pgrst, 'reload schema';
