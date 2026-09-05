create type public.tracking_mode as enum ('pages', 'percent', 'minutes');
create type public.run_status as enum ('reading', 'paused', 'completed', 'dnf');

alter table public.library_books
  add constraint library_books_id_user_unique unique (id, user_id);

create table public.reading_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  book_id uuid not null,
  status public.run_status not null default 'reading',
  tracking_mode public.tracking_mode not null default 'pages',
  started_on date not null,
  finished_on date,
  is_reread boolean not null default false,
  current_position numeric(10,2),
  total_units numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_runs_book_owner_fkey foreign key (book_id, user_id)
    references public.library_books(id, user_id) on delete cascade,
  constraint reading_runs_position_nonnegative check (current_position is null or current_position >= 0),
  constraint reading_runs_total_positive check (total_units is null or total_units > 0),
  constraint reading_runs_dates_valid check (finished_on is null or finished_on >= started_on)
);

create unique index reading_runs_one_active_per_book_idx
  on public.reading_runs (book_id)
  where status in ('reading', 'paused');
create index reading_runs_user_started_idx on public.reading_runs (user_id, started_on desc);
alter table public.reading_runs add constraint reading_runs_id_user_unique unique (id, user_id);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  run_id uuid not null,
  read_on date not null,
  check_in_only boolean not null default false,
  pages_read integer,
  minutes_read integer,
  resulting_percent numeric(5,2),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_sessions_run_owner_fkey foreign key (run_id, user_id)
    references public.reading_runs(id, user_id) on delete cascade,
  constraint reading_sessions_pages_positive check (pages_read is null or pages_read > 0),
  constraint reading_sessions_minutes_positive check (minutes_read is null or minutes_read > 0),
  constraint reading_sessions_percent_range check (resulting_percent is null or resulting_percent between 0 and 100),
  constraint reading_sessions_note_length check (note is null or char_length(note) <= 1000),
  constraint reading_sessions_has_activity check (
    check_in_only or pages_read is not null or minutes_read is not null or resulting_percent is not null
  )
);

create index reading_sessions_user_date_idx on public.reading_sessions (user_id, read_on desc);
create index reading_sessions_run_date_idx on public.reading_sessions (run_id, read_on desc);
create unique index reading_sessions_one_quick_checkin_idx
  on public.reading_sessions (run_id, read_on)
  where check_in_only and pages_read is null and minutes_read is null and resulting_percent is null;

create trigger reading_runs_set_updated_at before update on public.reading_runs
for each row execute function public.set_updated_at();
create trigger reading_sessions_set_updated_at before update on public.reading_sessions
for each row execute function public.set_updated_at();

alter table public.reading_runs enable row level security;
alter table public.reading_sessions enable row level security;
revoke all on table public.reading_runs, public.reading_sessions from anon;
grant select, insert, update, delete on table public.reading_runs, public.reading_sessions to authenticated;

create policy "Users can read their own reading runs" on public.reading_runs
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can add their own reading runs" on public.reading_runs
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own reading runs" on public.reading_runs
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own reading runs" on public.reading_runs
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own reading sessions" on public.reading_sessions
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can add their own reading sessions" on public.reading_sessions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own reading sessions" on public.reading_sessions
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own reading sessions" on public.reading_sessions
for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.log_reading_session(
  p_book_id uuid,
  p_read_on date default null,
  p_check_in_only boolean default true,
  p_pages_read integer default null,
  p_minutes_read integer default null,
  p_resulting_percent numeric default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  profile_timezone text;
  local_today date;
  session_date date;
  active_run_id uuid;
  created_session_id uuid;
  book_pages integer;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select p.timezone into profile_timezone from public.profiles p where p.user_id = current_user_id;
  local_today := timezone(coalesce(profile_timezone, 'UTC'), now())::date;
  session_date := coalesce(p_read_on, local_today);

  if session_date > local_today then
    raise exception 'future_reading_date' using errcode = '22023';
  end if;
  if not p_check_in_only and p_pages_read is null and p_minutes_read is null and p_resulting_percent is null then
    raise exception 'reading_activity_required' using errcode = '22023';
  end if;
  if p_pages_read is not null and p_pages_read <= 0 then raise exception 'invalid_pages' using errcode = '22023'; end if;
  if p_minutes_read is not null and p_minutes_read <= 0 then raise exception 'invalid_minutes' using errcode = '22023'; end if;
  if p_resulting_percent is not null and (p_resulting_percent < 0 or p_resulting_percent > 100) then raise exception 'invalid_percent' using errcode = '22023'; end if;
  if p_note is not null and char_length(p_note) > 1000 then raise exception 'note_too_long' using errcode = '22023'; end if;

  select b.page_count into book_pages from public.library_books b
  where b.id = p_book_id and b.user_id = current_user_id;
  if not found then raise exception 'book_not_found' using errcode = 'P0002'; end if;

  select r.id into active_run_id from public.reading_runs r
  where r.book_id = p_book_id and r.user_id = current_user_id and r.status in ('reading', 'paused')
  order by r.created_at desc limit 1;

  if active_run_id is null then
    insert into public.reading_runs (user_id, book_id, started_on, tracking_mode, total_units)
    values (
      current_user_id,
      p_book_id,
      session_date,
      case when p_minutes_read is not null then 'minutes'::public.tracking_mode when p_resulting_percent is not null then 'percent'::public.tracking_mode else 'pages'::public.tracking_mode end,
      case when p_resulting_percent is not null then 100 when book_pages is not null then book_pages else null end
    ) returning id into active_run_id;
  end if;

  if p_check_in_only and p_pages_read is null and p_minutes_read is null and p_resulting_percent is null then
    select s.id into created_session_id from public.reading_sessions s
    where s.run_id = active_run_id and s.read_on = session_date and s.check_in_only
      and s.pages_read is null and s.minutes_read is null and s.resulting_percent is null
    limit 1;
    if created_session_id is not null then return created_session_id; end if;
  end if;

  insert into public.reading_sessions (user_id, run_id, read_on, check_in_only, pages_read, minutes_read, resulting_percent, note)
  values (current_user_id, active_run_id, session_date, p_check_in_only, p_pages_read, p_minutes_read, p_resulting_percent, nullif(trim(p_note), ''))
  returning id into created_session_id;

  update public.reading_runs set
    status = 'reading',
    current_position = case
      when p_resulting_percent is not null then p_resulting_percent
      when p_pages_read is not null then coalesce(current_position, 0) + p_pages_read
      else current_position
    end
  where id = active_run_id and user_id = current_user_id;

  update public.library_books set status = 'reading'
  where id = p_book_id and user_id = current_user_id;

  return created_session_id;
end;
$$;

revoke all on function public.log_reading_session(uuid, date, boolean, integer, integer, numeric, text) from public, anon;
grant execute on function public.log_reading_session(uuid, date, boolean, integer, integer, numeric, text) to authenticated;
