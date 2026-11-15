begin;

-- A book changed by the organizer is NOT a completed club read.
-- Keep its historical progress and participants' personal books intact.
alter table public.book_club_reads
  drop constraint if exists book_club_reads_status_check;
alter table public.book_club_reads
  add constraint book_club_reads_status_check
  check (status in ('active', 'finished', 'replaced'));

-- The replacement is atomic. Lock the club so simultaneous owner actions cannot
-- change which read is active between the archive and insert steps.
create or replace function public.replace_book_club_read(
  p_club_id uuid,
  p_previous_read_id uuid,
  p_book_id uuid,
  p_started_on date,
  p_target_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  source_book public.library_books%rowtype;
  next_read_id uuid;
  safe_cover_url text;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  if p_started_on is null or (p_target_on is not null and p_target_on < p_started_on) then
    raise exception 'invalid_dates' using errcode = '22023';
  end if;

  perform 1 from public.book_clubs c
    where c.id = p_club_id and c.owner_id = current_user_id
    for update;
  if not found then
    raise exception 'club_owner_required' using errcode = '42501';
  end if;

  perform 1 from public.book_club_reads r
    where r.id = p_previous_read_id and r.club_id = p_club_id and r.status = 'active'
    for update;
  if not found then
    raise exception 'active_read_not_found' using errcode = '22023';
  end if;

  select b.* into source_book
    from public.library_books b
    where b.id = p_book_id and b.user_id = current_user_id;
  if not found then
    raise exception 'book_not_found' using errcode = '22023';
  end if;

  -- Never share a signed/private cover URL or an arbitrary remote URL.
  safe_cover_url := case
    when source_book.cover_url ~ '^https://(books\.google\.com|books\.googleusercontent\.com|covers\.openlibrary\.org)/'
    then source_book.cover_url else null end;

  update public.book_club_reads
    set status = 'replaced'
    where id = p_previous_read_id and club_id = p_club_id;

  insert into public.book_club_reads (
    club_id, created_by, title, authors, isbn, published_year,
    page_count, format, reading_language, cover_url,
    started_on, target_on
  ) values (
    p_club_id, current_user_id, source_book.title, source_book.authors,
    source_book.isbn, source_book.published_year, source_book.page_count,
    source_book.format, source_book.reading_language, safe_cover_url,
    p_started_on, p_target_on
  ) returning id into next_read_id;

  -- The owner connects only THEIR chosen book. Other members opt into the new
  -- selection independently; their old personal reading records are untouched.
  insert into public.book_club_progress (club_read_id, club_id, user_id, book_id)
  values (next_read_id, p_club_id, current_user_id, p_book_id);

  return next_read_id;
end;
$$;

revoke all on function public.replace_book_club_read(uuid, uuid, uuid, date, date)
  from public, anon, authenticated;
grant execute on function public.replace_book_club_read(uuid, uuid, uuid, date, date)
  to authenticated;

commit;
