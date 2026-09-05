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
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select p.timezone, b.page_count
  into profile_timezone, book_pages
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
      insert into public.reading_runs (
        user_id, book_id, status, tracking_mode, started_on, is_reread, total_units
      ) values (
        current_user_id,
        p_book_id,
        'reading',
        'pages',
        status_date,
        exists(
          select 1 from public.reading_runs r
          where r.book_id = p_book_id
            and r.user_id = current_user_id
            and r.status = 'completed'
        ),
        book_pages
      );
    else
      update public.reading_runs
      set status = 'reading', finished_on = null
      where id = active_run_id and user_id = current_user_id;
    end if;
  elsif p_status = 'paused' and active_run_id is not null then
    update public.reading_runs
    set status = 'paused', finished_on = null
    where id = active_run_id and user_id = current_user_id;
  elsif p_status = 'read' and active_run_id is not null then
    update public.reading_runs
    set status = 'completed',
      finished_on = greatest(active_started_on, status_date)
    where id = active_run_id and user_id = current_user_id;
  elsif p_status = 'dnf' and active_run_id is not null then
    update public.reading_runs
    set status = 'dnf',
      finished_on = greatest(active_started_on, status_date)
    where id = active_run_id and user_id = current_user_id;
  elsif p_status = 'want' and active_run_id is not null then
    if active_has_sessions then
      update public.reading_runs
      set status = 'paused', finished_on = null
      where id = active_run_id and user_id = current_user_id;
    else
      delete from public.reading_runs
      where id = active_run_id and user_id = current_user_id;
    end if;
  end if;

  update public.library_books
  set status = p_status
  where id = p_book_id and user_id = current_user_id;
end;
$$;

revoke all on function public.set_library_book_status(uuid, public.library_status, date) from public, anon;
grant execute on function public.set_library_book_status(uuid, public.library_status, date) to authenticated;

-- Repair runs left active by version 0.5.0 after a book was moved to a final shelf.
update public.reading_runs r
set status = case
    when b.status = 'read' then 'completed'::public.run_status
    else 'dnf'::public.run_status
  end,
  finished_on = greatest(
    r.started_on,
    timezone(coalesce(p.timezone, 'UTC'), now())::date
  )
from public.library_books b
join public.profiles p on p.user_id = b.user_id
where r.book_id = b.id
  and r.user_id = b.user_id
  and r.status in ('reading', 'paused')
  and b.status in ('read', 'dnf');

update public.reading_runs r
set status = 'paused', finished_on = null
from public.library_books b
where r.book_id = b.id
  and r.user_id = b.user_id
  and r.status = 'reading'
  and b.status in ('paused', 'want');
