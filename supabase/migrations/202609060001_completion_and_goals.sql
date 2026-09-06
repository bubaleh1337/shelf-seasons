do $$
begin
  create type public.nomination_kind as enum ('favorite', 'disappointment');
exception
  when duplicate_object then null;
end
$$;

alter table public.reading_runs
  add column if not exists rating numeric(2, 1),
  add column if not exists impression text;

alter table public.reading_runs
  drop constraint if exists reading_runs_rating_check,
  add constraint reading_runs_rating_check check (
    rating is null or (rating between 0.5 and 5 and rating * 2 = trunc(rating * 2))
  ),
  drop constraint if exists reading_runs_impression_length_check,
  add constraint reading_runs_impression_length_check check (
    impression is null or char_length(impression) <= 2000
  );

create table if not exists public.run_nominations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  run_id uuid not null,
  kind public.nomination_kind not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint run_nominations_run_owner_fkey
    foreign key (run_id, user_id)
    references public.reading_runs(id, user_id)
    on delete cascade,
  constraint run_nominations_one_per_run unique (run_id)
);

drop trigger if exists run_nominations_set_updated_at on public.run_nominations;
create trigger run_nominations_set_updated_at
before update on public.run_nominations
for each row execute function public.set_updated_at();

alter table public.run_nominations enable row level security;
revoke all on table public.run_nominations from anon;
grant select, insert, update, delete on table public.run_nominations to authenticated;

drop policy if exists "Users can read own run nominations" on public.run_nominations;
create policy "Users can read own run nominations"
  on public.run_nominations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own run nominations" on public.run_nominations;
create policy "Users can insert own run nominations"
  on public.run_nominations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own run nominations" on public.run_nominations;
create policy "Users can update own run nominations"
  on public.run_nominations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own run nominations" on public.run_nominations;
create policy "Users can delete own run nominations"
  on public.run_nominations for delete
  using (auth.uid() = user_id);

create or replace function public.finish_reading_run(
  p_book_id uuid,
  p_finished_on date,
  p_rating numeric default null,
  p_impression text default null,
  p_nomination public.nomination_kind default null
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
  selected_run public.reading_runs%rowtype;
  clean_impression text := nullif(btrim(p_impression), '');
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select p.timezone
  into profile_timezone
  from public.library_books b
  join public.profiles p on p.user_id = b.user_id
  where b.id = p_book_id and b.user_id = current_user_id;

  if not found then
    raise exception 'book_not_found' using errcode = 'P0002';
  end if;

  local_today := timezone(coalesce(profile_timezone, 'UTC'), now())::date;
  if p_finished_on > local_today then
    raise exception 'future_completion_date' using errcode = '22023';
  end if;
  if p_rating is not null and (p_rating < 0.5 or p_rating > 5 or p_rating * 2 <> trunc(p_rating * 2)) then
    raise exception 'invalid_rating' using errcode = '22023';
  end if;
  if clean_impression is not null and char_length(clean_impression) > 2000 then
    raise exception 'impression_too_long' using errcode = '22001';
  end if;

  select r.* into selected_run
  from public.reading_runs r
  where r.book_id = p_book_id
    and r.user_id = current_user_id
    and r.status in ('reading', 'paused')
  order by r.created_at desc
  limit 1
  for update;

  if selected_run.id is null then
    select r.* into selected_run
    from public.reading_runs r
    join public.library_books b on b.id = r.book_id and b.user_id = r.user_id
    where r.book_id = p_book_id
      and r.user_id = current_user_id
      and r.status = 'completed'
      and b.status = 'read'
    order by r.finished_on desc nulls last, r.created_at desc
    limit 1
    for update;
  end if;

  if selected_run.id is null then
    raise exception 'active_run_not_found' using errcode = 'P0002';
  end if;
  if p_finished_on < selected_run.started_on then
    raise exception 'completion_before_start' using errcode = '22023';
  end if;

  update public.reading_runs
  set status = 'completed',
      finished_on = p_finished_on,
      rating = p_rating,
      impression = clean_impression
  where id = selected_run.id and user_id = current_user_id;

  update public.library_books
  set status = 'read'
  where id = p_book_id and user_id = current_user_id;

  delete from public.run_nominations
  where run_id = selected_run.id and user_id = current_user_id;

  if p_nomination is not null then
    insert into public.run_nominations (user_id, run_id, kind)
    values (current_user_id, selected_run.id, p_nomination);
  end if;

  return selected_run.id;
end;
$$;

revoke all on function public.finish_reading_run(uuid, date, numeric, text, public.nomination_kind) from public, anon;
grant execute on function public.finish_reading_run(uuid, date, numeric, text, public.nomination_kind) to authenticated;

-- Keep shelf changes and reading history consistent. In particular, adding a book
-- directly as "read" creates a completed run so yearly goals remain truthful.
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
      insert into public.reading_runs (user_id, book_id, status, tracking_mode, started_on, is_reread, total_units)
      values (current_user_id, p_book_id, 'reading', 'pages', status_date,
        exists(select 1 from public.reading_runs r where r.book_id = p_book_id and r.user_id = current_user_id and r.status = 'completed'),
        book_pages);
    else
      update public.reading_runs set status = 'reading', finished_on = null
      where id = active_run_id and user_id = current_user_id;
    end if;
  elsif p_status = 'paused' and active_run_id is not null then
    update public.reading_runs set status = 'paused', finished_on = null
    where id = active_run_id and user_id = current_user_id;
  elsif p_status = 'read' then
    if active_run_id is null then
      insert into public.reading_runs (user_id, book_id, status, tracking_mode, started_on, finished_on, is_reread, total_units)
      values (current_user_id, p_book_id, 'completed', 'pages', status_date, status_date,
        exists(select 1 from public.reading_runs r where r.book_id = p_book_id and r.user_id = current_user_id and r.status = 'completed'),
        book_pages);
    else
      update public.reading_runs set status = 'completed', finished_on = greatest(active_started_on, status_date)
      where id = active_run_id and user_id = current_user_id;
    end if;
  elsif p_status = 'dnf' and active_run_id is not null then
    update public.reading_runs set status = 'dnf', finished_on = greatest(active_started_on, status_date)
    where id = active_run_id and user_id = current_user_id;
  elsif p_status = 'want' and active_run_id is not null then
    if active_has_sessions then
      update public.reading_runs set status = 'paused', finished_on = null
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
