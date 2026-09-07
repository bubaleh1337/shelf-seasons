do $$
begin
  create type public.book_season as enum ('spring', 'summer', 'autumn', 'winter');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.reading_language as enum ('ru', 'en', 'other');
exception
  when duplicate_object then null;
end
$$;

alter table public.library_books
  add column if not exists season public.book_season,
  add column if not exists reading_language public.reading_language not null default 'other';

alter table public.reading_runs
  add column if not exists reading_language public.reading_language not null default 'other';

create index if not exists library_books_user_season_idx
  on public.library_books (user_id, season);

create index if not exists reading_runs_user_language_idx
  on public.reading_runs (user_id, reading_language, finished_on);

update public.reading_runs r
set reading_language = b.reading_language
from public.library_books b
where b.id = r.book_id
  and b.user_id = r.user_id
  and r.status in ('reading', 'paused');

create or replace function public.sync_active_run_language()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reading_language is distinct from old.reading_language then
    update public.reading_runs
    set reading_language = new.reading_language
    where book_id = new.id
      and user_id = new.user_id
      and status in ('reading', 'paused');
  end if;
  return new;
end;
$$;

drop trigger if exists library_books_sync_active_run_language on public.library_books;
create trigger library_books_sync_active_run_language
after update of reading_language on public.library_books
for each row execute function public.sync_active_run_language();

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
  book_language public.reading_language;
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

  select b.page_count, b.reading_language into book_pages, book_language
  from public.library_books b
  where b.id = p_book_id and b.user_id = current_user_id;
  if not found then raise exception 'book_not_found' using errcode = 'P0002'; end if;

  select r.id into active_run_id from public.reading_runs r
  where r.book_id = p_book_id and r.user_id = current_user_id and r.status in ('reading', 'paused')
  order by r.created_at desc limit 1;

  if active_run_id is null then
    insert into public.reading_runs (user_id, book_id, started_on, tracking_mode, total_units, reading_language)
    values (
      current_user_id,
      p_book_id,
      session_date,
      case when p_minutes_read is not null then 'minutes'::public.tracking_mode when p_resulting_percent is not null then 'percent'::public.tracking_mode else 'pages'::public.tracking_mode end,
      case when p_resulting_percent is not null then 100 when book_pages is not null then book_pages else null end,
      book_language
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

create or replace function public.set_library_book_status(
  p_book_id uuid,
  p_status public.library_status,
  p_changed_on date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  profile_timezone text;
  local_today date;
  status_date date;
  active_run_id uuid;
  active_started_on date;
  active_has_sessions boolean;
  book_pages integer;
  book_language public.reading_language;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select p.timezone, b.page_count, b.reading_language
  into profile_timezone, book_pages, book_language
  from public.library_books b
  join public.profiles p on p.user_id = b.user_id
  where b.id = p_book_id and b.user_id = current_user_id;
  if not found then
    raise exception 'book_not_found' using errcode = 'P0002';
  end if;

  local_today := timezone(coalesce(profile_timezone, 'UTC'), now())::date;
  status_date := coalesce(p_changed_on, local_today);
  if status_date > local_today then
    raise exception 'future_status_date' using errcode = '22023';
  end if;

  select r.id, r.started_on,
    exists(select 1 from public.reading_sessions s where s.run_id = r.id)
  into active_run_id, active_started_on, active_has_sessions
  from public.reading_runs r
  where r.book_id = p_book_id
    and r.user_id = current_user_id
    and r.status in ('reading', 'paused')
  order by r.created_at desc
  limit 1
  for update;

  if p_status = 'reading' then
    if active_run_id is null then
      insert into public.reading_runs (user_id, book_id, status, tracking_mode, started_on, is_reread, total_units, reading_language)
      values (current_user_id, p_book_id, 'reading', 'pages', status_date,
        exists(select 1 from public.reading_runs r where r.book_id = p_book_id and r.user_id = current_user_id and r.status = 'completed'),
        book_pages, book_language);
    else
      update public.reading_runs set status = 'reading', finished_on = null, reading_language = book_language
      where id = active_run_id and user_id = current_user_id;
    end if;
  elsif p_status = 'paused' and active_run_id is not null then
    update public.reading_runs set status = 'paused', finished_on = null, reading_language = book_language
    where id = active_run_id and user_id = current_user_id;
  elsif p_status = 'read' then
    if active_run_id is null then
      insert into public.reading_runs (user_id, book_id, status, tracking_mode, started_on, finished_on, is_reread, total_units, reading_language)
      values (current_user_id, p_book_id, 'completed', 'pages', status_date, status_date,
        exists(select 1 from public.reading_runs r where r.book_id = p_book_id and r.user_id = current_user_id and r.status = 'completed'),
        book_pages, book_language);
    else
      update public.reading_runs set status = 'completed', finished_on = greatest(active_started_on, status_date), reading_language = book_language
      where id = active_run_id and user_id = current_user_id;
    end if;
  elsif p_status = 'dnf' and active_run_id is not null then
    update public.reading_runs set status = 'dnf', finished_on = greatest(active_started_on, status_date), reading_language = book_language
    where id = active_run_id and user_id = current_user_id;
  elsif p_status = 'want' and active_run_id is not null then
    if active_has_sessions then
      update public.reading_runs set status = 'paused', finished_on = null, reading_language = book_language
      where id = active_run_id and user_id = current_user_id;
    else
      delete from public.reading_runs where id = active_run_id and user_id = current_user_id;
    end if;
  end if;

  update public.library_books set status = p_status
  where id = p_book_id and user_id = current_user_id;
end;
$$;

revoke all on function public.set_library_book_status(uuid, public.library_status, date) from public, anon;
grant execute on function public.set_library_book_status(uuid, public.library_status, date) to authenticated;
