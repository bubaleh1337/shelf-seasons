begin;

-- Club data is opt-in and separate from private library records.
create schema if not exists private;

create table public.book_clubs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  invite_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

create table public.book_club_members (
  club_id uuid not null references public.book_clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index book_club_members_user_idx on public.book_club_members (user_id, club_id);

create table public.book_club_reads (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs(id) on delete cascade,
  created_by uuid not null references public.profiles(user_id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  authors text[] not null default '{}',
  started_on date not null,
  target_on date,
  status text not null default 'active' check (status in ('active', 'finished')),
  created_at timestamptz not null default now(),
  constraint book_club_reads_dates_check check (target_on is null or target_on >= started_on),
  constraint book_club_reads_id_club_unique unique (id, club_id)
);
create index book_club_reads_club_created_idx on public.book_club_reads (club_id, created_at desc);
create unique index book_club_reads_one_active_idx on public.book_club_reads (club_id) where status = 'active';

create table public.book_club_progress (
  club_read_id uuid not null,
  club_id uuid not null,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  book_id uuid not null,
  current_page integer,
  total_pages integer,
  percent numeric(5,1),
  is_complete boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (club_read_id, user_id),
  constraint book_club_progress_read_fk foreign key (club_read_id, club_id)
    references public.book_club_reads(id, club_id) on delete cascade,
  constraint book_club_progress_book_owner_fk foreign key (book_id, user_id)
    references public.library_books(id, user_id) on delete cascade,
  constraint book_club_progress_range check (percent is null or percent between 0 and 100),
  constraint book_club_progress_pages_check check (current_page is null or current_page >= 0)
);
create index book_club_progress_book_user_idx on public.book_club_progress (book_id, user_id);
create index book_club_progress_club_idx on public.book_club_progress (club_id);
create index if not exists reading_runs_user_book_recent_idx
  on public.reading_runs (user_id, book_id, created_at desc);

-- A fixed-search-path helper prevents recursive RLS evaluation between clubs and members.
create or replace function private.club_ids_for_user()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select cm.club_id from public.book_club_members cm where cm.user_id = (select auth.uid());
$$;
revoke all on function private.club_ids_for_user() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.club_ids_for_user() to authenticated;

create or replace function private.add_book_club_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.book_club_members (club_id, user_id, display_name)
  select new.id, new.owner_id, coalesce(nullif(left(btrim(p.display_name),80), ''), 'Reader')
  from public.profiles p where p.user_id = new.owner_id;
  return new;
end;
$$;
create trigger book_club_add_owner after insert on public.book_clubs
for each row execute function private.add_book_club_owner();

-- Leaving a club revokes all previously shared progress immediately.
create or replace function private.remove_book_club_progress_on_leave()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.book_club_progress p
  where p.club_id = old.club_id and p.user_id = old.user_id;
  return old;
end;
$$;
create trigger book_club_leave_cleanup after delete on public.book_club_members
for each row execute function private.remove_book_club_progress_on_leave();

-- Invite-token lookup must not expose clubs to visitors without the token.
-- This narrowly scoped exposed SECURITY DEFINER function inserts only auth.uid().
create or replace function public.join_book_club(p_invite_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  found_id uuid;
  member_count integer;
  member_name text;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  if p_invite_token is null or p_invite_token !~ '^[a-f0-9]{32}$' then
    raise exception 'invalid_invite' using errcode = '22023';
  end if;
  select c.id into found_id from public.book_clubs c
    where c.invite_token = p_invite_token for update;
  if found_id is null then
    raise exception 'invalid_invite' using errcode = '22023';
  end if;
  if exists (select 1 from public.book_club_members m where m.club_id = found_id and m.user_id = current_user_id) then
    return found_id;
  end if;
  select count(*) into member_count from public.book_club_members m where m.club_id = found_id;
  if member_count >= 50 then
    raise exception 'club_full' using errcode = '22023';
  end if;
  select coalesce(nullif(left(btrim(p.display_name),80), ''), 'Reader') into member_name
    from public.profiles p where p.user_id = current_user_id;
  if member_name is null then
    raise exception 'profile_required' using errcode = '28000';
  end if;
  insert into public.book_club_members (club_id, user_id, display_name)
    values (found_id, current_user_id, member_name)
    on conflict do nothing;
  return found_id;
end;
$$;
revoke all on function public.join_book_club(text) from public, anon, authenticated;
grant execute on function public.join_book_club(text) to authenticated;

-- Progress is computed exclusively from the linked personal reading run.
-- Impressions, ratings and reading sessions are never shared.
create or replace function private.refresh_club_progress(p_user_id uuid, p_book_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  latest_run public.reading_runs%rowtype;
begin
  select * into latest_run from public.reading_runs r
  where r.user_id = p_user_id and r.book_id = p_book_id
  order by r.created_at desc, r.id desc limit 1;

  update public.book_club_progress p set
    current_page = case when latest_run.id is not null and latest_run.tracking_mode = 'pages'
      then latest_run.current_position::integer else null end,
    total_pages = case when latest_run.id is not null and latest_run.tracking_mode = 'pages'
      then latest_run.total_units::integer else null end,
    percent = case when latest_run.id is null then null
      when latest_run.status = 'completed' then 100
      when latest_run.total_units > 0 and latest_run.current_position is not null
      then least(100, greatest(0, round(latest_run.current_position * 100 / latest_run.total_units, 1)))
      else null end,
    is_complete = coalesce(latest_run.status = 'completed', false),
    updated_at = now()
  where p.user_id = p_user_id and p.book_id = p_book_id
    and exists (select 1 from public.book_club_reads cr
      where cr.id = p.club_read_id and cr.status = 'active');
end;
$$;
revoke all on function private.refresh_club_progress(uuid, uuid) from public, anon, authenticated;

create or replace function private.on_reading_run_club_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_club_progress(old.user_id, old.book_id);
    return old;
  end if;
  perform private.refresh_club_progress(new.user_id, new.book_id);
  if tg_op = 'UPDATE' and (old.user_id, old.book_id) is distinct from (new.user_id, new.book_id) then
    perform private.refresh_club_progress(old.user_id, old.book_id);
  end if;
  return new;
end;
$$;
create trigger book_club_sync_reading_run after insert or update or delete on public.reading_runs
for each row execute function private.on_reading_run_club_sync();

create or replace function private.on_club_progress_link()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_club_progress(new.user_id, new.book_id);
  return new;
end;
$$;
create trigger book_club_link_progress after insert or update of book_id on public.book_club_progress
for each row execute function private.on_club_progress_link();

alter table public.book_clubs enable row level security;
alter table public.book_club_members enable row level security;
alter table public.book_club_reads enable row level security;
alter table public.book_club_progress enable row level security;

revoke all on public.book_clubs, public.book_club_members, public.book_club_reads, public.book_club_progress from public, anon, authenticated;
grant select, insert, delete on public.book_clubs to authenticated;
grant select, delete on public.book_club_members to authenticated;
grant select, insert on public.book_club_reads to authenticated;
grant update (status) on public.book_club_reads to authenticated;
grant insert, delete on public.book_club_progress to authenticated;
grant select (club_read_id, club_id, user_id, current_page, total_pages, percent, is_complete, updated_at)
  on public.book_club_progress to authenticated;
grant update (book_id) on public.book_club_progress to authenticated;

create policy book_clubs_select_members on public.book_clubs for select to authenticated
  using (id in (select private.club_ids_for_user()));
create policy book_clubs_insert_owner on public.book_clubs for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy book_clubs_delete_owner on public.book_clubs for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy book_club_members_select on public.book_club_members for select to authenticated
  using (club_id in (select private.club_ids_for_user()));
create policy book_club_members_leave on public.book_club_members for delete to authenticated
  using (user_id = (select auth.uid()) and not exists (
    select 1 from public.book_clubs c where c.id = club_id and c.owner_id = (select auth.uid())
  ));

create policy book_club_reads_select on public.book_club_reads for select to authenticated
  using (club_id in (select private.club_ids_for_user()));
create policy book_club_reads_insert_owner on public.book_club_reads for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (
    select 1 from public.book_clubs c where c.id = club_id and c.owner_id = (select auth.uid())
  ));
create policy book_club_reads_update_owner on public.book_club_reads for update to authenticated
  using (exists (select 1 from public.book_clubs c where c.id = club_id and c.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.book_clubs c where c.id = club_id and c.owner_id = (select auth.uid())));

create policy book_club_progress_select on public.book_club_progress for select to authenticated
  using (club_id in (select private.club_ids_for_user()));
create policy book_club_progress_insert_own on public.book_club_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and club_id in (select private.club_ids_for_user())
    and exists (select 1 from public.book_club_reads r where r.id = club_read_id and r.status = 'active'));
create policy book_club_progress_update_own on public.book_club_progress for update to authenticated
  using (user_id = (select auth.uid()) and club_id in (select private.club_ids_for_user()))
  with check (user_id = (select auth.uid()) and club_id in (select private.club_ids_for_user()));
create policy book_club_progress_delete_own on public.book_club_progress for delete to authenticated
  using (user_id = (select auth.uid()) and club_id in (select private.club_ids_for_user()));

commit;
