-- Run this file in Supabase SQL Editor.
create sequence if not exists public.member_id_seq start 1;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  public_id bigint unique default nextval('public.member_id_seq'),
  username text unique not null,
  display_name text,
  bio text default '',
  avatar_url text,
  banner_asset_id uuid,
  border_asset_id uuid,
  role text not null default 'free' check (role in ('free','premium','admin','owner')),
  level bigint not null default 1 check (level >= 1),
  total_exp bigint not null default 0 check (total_exp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Profiles are publicly readable" on public.profiles;
drop policy if exists "Users can update own profile basics" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update own profile basics"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Profile creation is handled by the trusted auth.users trigger below.
-- Users may edit only cosmetic/basic columns, never role, EXP, level, or public_id.
revoke insert, update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_url, banner_asset_id, border_asset_id)
  on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  base_name text;
  candidate text;
  suffix integer := 0;
begin
  base_name := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    '[^a-zA-Z0-9_]', '', 'g'
  ));
  if length(base_name) < 3 then
    base_name := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  candidate := left(base_name, 20);

  while exists (select 1 from public.profiles p where p.username = candidate and p.id <> new.id) loop
    suffix := suffix + 1;
    candidate := left(base_name, 20 - length(suffix::text)) || suffix::text;
  end loop;

  insert into public.profiles(id, username, display_name)
  values(new.id, candidate, coalesce(new.raw_user_meta_data->>'display_name', candidate))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.border_assets (
 id uuid primary key default gen_random_uuid(), name text not null, category text not null default 'common',
 image_url text not null, github_path text, access_role text not null default 'all',
 active boolean not null default true, created_at timestamptz default now()
);
create table if not exists public.banner_assets (
 id uuid primary key default gen_random_uuid(), name text not null, description text default '',
 image_url text not null, github_path text, access_role text not null default 'all',
 active boolean not null default true, created_at timestamptz default now()
);
create table if not exists public.user_borders (
 user_id uuid references public.profiles(id) on delete cascade,
 border_id uuid references public.border_assets(id) on delete cascade,
 acquired_at timestamptz default now(), primary key(user_id,border_id)
);
create table if not exists public.user_banners (
 user_id uuid references public.profiles(id) on delete cascade,
 banner_id uuid references public.banner_assets(id) on delete cascade,
 acquired_at timestamptz default now(), primary key(user_id,banner_id)
);
create table if not exists public.user_bookmarks (
 user_id uuid references public.profiles(id) on delete cascade,
 anime_id text not null, anime_title text, poster_url text,
 created_at timestamptz default now(), primary key(user_id,anime_id)
);
create table if not exists public.watch_history (
 user_id uuid references public.profiles(id) on delete cascade,
 anime_id text not null, episode_id text, progress_seconds integer default 0,
 updated_at timestamptz default now(), primary key(user_id,anime_id)
);
alter table public.border_assets enable row level security;
alter table public.banner_assets enable row level security;
alter table public.user_borders enable row level security;
alter table public.user_banners enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.watch_history enable row level security;
create policy "Active borders readable" on public.border_assets for select using (active=true);
create policy "Active banners readable" on public.banner_assets for select using (active=true);
create policy "Users read own borders" on public.user_borders for select using (auth.uid()=user_id);
create policy "Users read own banners" on public.user_banners for select using (auth.uid()=user_id);
create policy "Users manage own bookmarks" on public.user_bookmarks for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Users manage own history" on public.watch_history for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
-- IMPORTANT: assign admin/owner roles manually from trusted SQL/admin tooling only.
