-- Nime Space: timed premium, episode comments, and claimable premium giveaways.
-- Run after supabase/schema.sql in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists premium_expires_at timestamptz;

-- Existing manually assigned Premium members receive an initial 30-day period.
update public.profiles
set premium_expires_at = now() + interval '30 days'
where role = 'premium' and premium_expires_at is null;

create table if not exists public.episode_comments (
  id uuid primary key default gen_random_uuid(),
  episode_id text not null,
  anime_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists episode_comments_episode_created_idx
  on public.episode_comments(episode_id, created_at desc);
alter table public.episode_comments enable row level security;
drop policy if exists "Episode comments readable" on public.episode_comments;
create policy "Episode comments readable" on public.episode_comments
  for select to anon, authenticated using (true);
drop policy if exists "Signed in users can comment" on public.episode_comments;
create policy "Signed in users can comment" on public.episode_comments
  for insert to authenticated with check (
    auth.uid() = user_id and exists(select 1 from public.profiles p where p.id=auth.uid())
  );
drop policy if exists "Users and admins can delete comments" on public.episode_comments;
create policy "Users and admins can delete comments" on public.episode_comments
  for delete to authenticated using (
    auth.uid() = user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner'))
  );

grant select on public.episode_comments to anon, authenticated;
grant insert, delete on public.episode_comments to authenticated;

create table if not exists public.premium_giveaways (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 300),
  duration_days integer not null check (duration_days in (1,3,7,30)),
  max_claims integer not null check (max_claims between 1 and 500),
  claimed_count integer not null default 0 check (claimed_count >= 0 and claimed_count <= max_claims),
  active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists premium_giveaways_active_created_idx
  on public.premium_giveaways(active, created_at desc);
alter table public.premium_giveaways enable row level security;
drop policy if exists "Active giveaways are public" on public.premium_giveaways;
create policy "Active giveaways are public" on public.premium_giveaways
  for select to anon, authenticated using (active=true or exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner')
  ));
drop policy if exists "Admins create giveaways" on public.premium_giveaways;
create policy "Admins create giveaways" on public.premium_giveaways
  for insert to authenticated with check (
    created_by=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner'))
  );
drop policy if exists "Admins update giveaways" on public.premium_giveaways;
create policy "Admins update giveaways" on public.premium_giveaways
  for update to authenticated using (
    exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner'))
  ) with check (
    exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','owner'))
  );
grant select on public.premium_giveaways to anon, authenticated;
grant insert, update on public.premium_giveaways to authenticated;

create table if not exists public.premium_giveaway_claims (
  id uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references public.premium_giveaways(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  days_awarded integer not null check (days_awarded in (1,3,7,30)),
  claimed_at timestamptz not null default now(),
  unique(giveaway_id, user_id)
);
create index if not exists premium_giveaway_claims_user_idx
  on public.premium_giveaway_claims(user_id, claimed_at desc);
alter table public.premium_giveaway_claims enable row level security;
drop policy if exists "Users read own giveaway claims" on public.premium_giveaway_claims;
create policy "Users read own giveaway claims" on public.premium_giveaway_claims
  for select to authenticated using (auth.uid()=user_id);
grant select on public.premium_giveaway_claims to authenticated;

create or replace function public.claim_premium_giveaway(target_giveaway_id uuid)
returns table(success boolean, message text, days_awarded integer, premium_expires_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare
  current_user_id uuid := auth.uid();
  giveaway_row public.premium_giveaways%rowtype;
  member_row public.profiles%rowtype;
  new_expiry timestamptz;
begin
  if current_user_id is null then
    return query select false, 'Silakan masuk terlebih dahulu.', 0, null::timestamptz; return;
  end if;
  select * into member_row from public.profiles where id=current_user_id for update;
  if not found then
    return query select false, 'Profil member tidak ditemukan.', 0, null::timestamptz; return;
  end if;
  if member_row.role in ('admin','owner') then
    return query select false, 'Role admin/owner sudah memiliki premium unlimited.', 0, null::timestamptz; return;
  end if;
  select * into giveaway_row from public.premium_giveaways where id=target_giveaway_id for update;
  if not found or not giveaway_row.active then
    return query select false, 'Giveaway tidak tersedia.', 0, null::timestamptz; return;
  end if;
  if giveaway_row.claimed_count >= giveaway_row.max_claims then
    return query select false, 'Kuota giveaway sudah habis.', 0, null::timestamptz; return;
  end if;
  if exists(select 1 from public.premium_giveaway_claims c where c.giveaway_id=target_giveaway_id and c.user_id=current_user_id) then
    return query select false, 'Kamu sudah pernah claim giveaway ini.', 0, null::timestamptz; return;
  end if;
  new_expiry := greatest(coalesce(member_row.premium_expires_at, now()), now()) + make_interval(days => giveaway_row.duration_days);
  insert into public.premium_giveaway_claims(giveaway_id,user_id,days_awarded)
    values(target_giveaway_id,current_user_id,giveaway_row.duration_days);
  update public.premium_giveaways set claimed_count=claimed_count+1 where id=target_giveaway_id;
  update public.profiles set role='premium', premium_expires_at=new_expiry, updated_at=now()
    where id=current_user_id;
  return query select true, 'Premium berhasil ditambahkan ke akunmu!', giveaway_row.duration_days, new_expiry;
end; $$;
revoke all on function public.claim_premium_giveaway(uuid) from public;
grant execute on function public.claim_premium_giveaway(uuid) to authenticated;

-- Premium status is derived from role + expiry. Admin and owner are always unlimited.
create or replace function public.get_premium_days_remaining(target_user_id uuid)
returns integer language sql stable security definer set search_path=public as $$
  select case
    when p.role in ('admin','owner') then null
    when p.role='premium' and p.premium_expires_at > now()
      then greatest(1, ceil(extract(epoch from (p.premium_expires_at-now()))/86400.0)::integer)
    else 0
  end
  from public.profiles p where p.id=target_user_id;
$$;
revoke all on function public.get_premium_days_remaining(uuid) from public;
grant execute on function public.get_premium_days_remaining(uuid) to authenticated;
