begin;

alter table public.recap_selections
  add column if not exists book_id uuid references public.library_books(id) on delete cascade;

update public.recap_selections selection
set book_id = run.book_id
from public.reading_runs run
where selection.category <> 'favorite_series'
  and selection.run_id = run.id
  and selection.book_id is null;

alter table public.recap_selections
  drop constraint if exists recap_selections_one_value;

create or replace function public.validate_recap_selection()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.category = 'favorite_series' then
    if not exists (
      select 1 from public.series series
      where series.id = new.series_id and series.user_id = new.user_id
    ) then
      raise exception 'series_not_owned_for_recap' using errcode = '23514';
    end if;
  elsif not exists (
    select 1 from public.library_books book
    where book.id = new.book_id and book.user_id = new.user_id
  ) then
    raise exception 'book_not_owned_for_recap' using errcode = '23514';
  end if;
  return new;
end;
$$;

update public.recap_selections
set run_id = null
where category <> 'favorite_series' and book_id is not null;

alter table public.recap_selections
  add constraint recap_selections_one_value check (
    (category = 'favorite_series' and series_id is not null and book_id is null and run_id is null)
    or
    (category <> 'favorite_series' and book_id is not null and series_id is null and run_id is null)
  );

create index if not exists recap_selections_book_idx
  on public.recap_selections (user_id, book_id)
  where book_id is not null;

create index if not exists library_books_user_title_idx
  on public.library_books (user_id, title);

create index if not exists reading_runs_user_completed_idx
  on public.reading_runs (user_id, finished_on desc)
  where status = 'completed';

commit;
