begin;

alter table public.reading_sessions
  add column if not exists ending_page integer;

alter table public.reading_sessions
  drop constraint if exists reading_sessions_ending_page_check,
  add constraint reading_sessions_ending_page_check check (
    ending_page is null or ending_page > 0
  );

comment on column public.reading_sessions.ending_page is
  'Absolute page where the reader stopped after this session.';

-- Older versions could create an extra completed run when an already-read
-- book was edited. Existing history is intentionally preserved because a
-- real same-day reread can look identical at the database level. Version
-- 0.14 deduplicates recap presentation and prevents new duplicate runs.

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
  active_tracking_mode public.tracking_mode;
  active_position numeric;
  created_session_id uuid;
  book_pages integer;
  book_language public.reading_language;
  previous_page integer := 0;
  pages_delta integer;
  calculated_percent numeric;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select p.timezone into profile_timezone
  from public.profiles p
  where p.user_id = current_user_id;

  local_today := timezone(coalesce(profile_timezone, 'UTC'), now())::date;
  session_date := coalesce(p_read_on, local_today);

  if session_date > local_today then
    raise exception 'future_reading_date' using errcode = '22023';
  end if;
  if not p_check_in_only and p_pages_read is null and p_minutes_read is null then
    raise exception 'reading_activity_required' using errcode = '22023';
  end if;
  if p_pages_read is not null and p_pages_read <= 0 then
    raise exception 'invalid_current_page' using errcode = '22023';
  end if;
  if p_minutes_read is not null and p_minutes_read <= 0 then
    raise exception 'invalid_minutes' using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 1000 then
    raise exception 'note_too_long' using errcode = '22023';
  end if;

  select b.page_count, b.reading_language
  into book_pages, book_language
  from public.library_books b
  where b.id = p_book_id and b.user_id = current_user_id;
  if not found then
    raise exception 'book_not_found' using errcode = 'P0002';
  end if;
  if p_pages_read is not null and book_pages is not null and p_pages_read > book_pages then
    raise exception 'current_page_exceeds_book' using errcode = '22023';
  end if;

  select r.id, r.tracking_mode, r.current_position
  into active_run_id, active_tracking_mode, active_position
  from public.reading_runs r
  where r.book_id = p_book_id
    and r.user_id = current_user_id
    and r.status in ('reading', 'paused')
  order by r.created_at desc
  limit 1
  for update;

  if active_run_id is null then
    insert into public.reading_runs (
      user_id, book_id, started_on, tracking_mode, total_units, reading_language
    ) values (
      current_user_id,
      p_book_id,
      session_date,
      case when p_pages_read is not null then 'pages'::public.tracking_mode else 'minutes'::public.tracking_mode end,
      case when p_pages_read is not null then book_pages else null end,
      book_language
    ) returning id into active_run_id;
  elsif p_pages_read is not null then
    previous_page := case
      when active_tracking_mode = 'pages' then greatest(0, coalesce(active_position, 0)::integer)
      when active_tracking_mode = 'percent' and book_pages is not null then greatest(0, round(coalesce(active_position, 0) * book_pages / 100)::integer)
      else 0
    end;
  end if;

  if p_check_in_only and p_pages_read is null and p_minutes_read is null then
    select s.id into created_session_id
    from public.reading_sessions s
    where s.run_id = active_run_id
      and s.read_on = session_date
      and s.check_in_only
      and s.pages_read is null
      and s.minutes_read is null
      and s.resulting_percent is null
      and s.ending_page is null
    limit 1;
    if created_session_id is not null then
      return created_session_id;
    end if;
  end if;

  if p_pages_read is not null then
    pages_delta := p_pages_read - previous_page;
    if pages_delta <= 0 then pages_delta := null; end if;
    if book_pages is not null then
      calculated_percent := least(100, round(p_pages_read::numeric * 100 / book_pages, 1));
    end if;
  end if;

  insert into public.reading_sessions (
    user_id, run_id, read_on, check_in_only, pages_read, minutes_read,
    resulting_percent, ending_page, note
  ) values (
    current_user_id, active_run_id, session_date, p_check_in_only, pages_delta,
    p_minutes_read, calculated_percent, p_pages_read, nullif(trim(p_note), '')
  ) returning id into created_session_id;

  update public.reading_runs set
    status = 'reading',
    tracking_mode = case when p_pages_read is not null then 'pages'::public.tracking_mode else tracking_mode end,
    current_position = case when p_pages_read is not null then p_pages_read else current_position end,
    total_units = case when p_pages_read is not null then book_pages else total_units end,
    reading_language = book_language
  where id = active_run_id and user_id = current_user_id;

  update public.library_books set status = 'reading'
  where id = p_book_id and user_id = current_user_id;

  return created_session_id;
end;
$$;

revoke all on function public.log_reading_session(uuid, date, boolean, integer, integer, numeric, text) from public, anon;
grant execute on function public.log_reading_session(uuid, date, boolean, integer, integer, numeric, text) to authenticated;

commit;
