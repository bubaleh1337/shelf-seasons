do $$
begin
  create type public.recap_period_type as enum ('month', 'year');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.recap_category as enum (
    'favorite_book',
    'biggest_disappointment',
    'favorite_cover',
    'favorite_series'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.recap_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  period_type public.recap_period_type not null,
  period_start date not null,
  category public.recap_category not null,
  run_id uuid,
  series_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recap_selections_run_owner_fkey
    foreign key (run_id, user_id)
    references public.reading_runs(id, user_id)
    on delete cascade,
  constraint recap_selections_series_owner_fkey
    foreign key (series_id, user_id)
    references public.series(id, user_id)
    on delete cascade,
  constraint recap_selections_one_value check (
    (category = 'favorite_series' and series_id is not null and run_id is null)
    or
    (category <> 'favorite_series' and run_id is not null and series_id is null)
  ),
  constraint recap_selections_canonical_start check (
    (period_type = 'month' and extract(day from period_start) = 1)
    or
    (period_type = 'year' and extract(month from period_start) = 1 and extract(day from period_start) = 1)
  ),
  constraint recap_selections_one_category unique (user_id, period_type, period_start, category)
);

create index if not exists recap_selections_period_idx
  on public.recap_selections (user_id, period_type, period_start);

create or replace function public.validate_recap_selection()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  period_end date;
begin
  period_end := case
    when new.period_type = 'month' then (new.period_start + interval '1 month')::date
    else (new.period_start + interval '1 year')::date
  end;

  if new.category = 'favorite_series' then
    if not exists (
      select 1
      from public.series s
      join public.series_entries e
        on e.series_id = s.id and e.user_id = s.user_id
      join public.reading_runs r
        on r.book_id = e.book_id and r.user_id = s.user_id
      where s.id = new.series_id
        and s.user_id = new.user_id
        and r.status = 'completed'
        and r.finished_on >= new.period_start
        and r.finished_on < period_end
    ) then
      raise exception 'series_not_eligible_for_recap' using errcode = '23514';
    end if;
  elsif not exists (
    select 1
    from public.reading_runs r
    where r.id = new.run_id
      and r.user_id = new.user_id
      and r.status = 'completed'
      and r.finished_on >= new.period_start
      and r.finished_on < period_end
  ) then
    raise exception 'run_not_eligible_for_recap' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists recap_selections_validate on public.recap_selections;
create trigger recap_selections_validate
before insert or update on public.recap_selections
for each row execute function public.validate_recap_selection();

drop trigger if exists recap_selections_set_updated_at on public.recap_selections;
create trigger recap_selections_set_updated_at
before update on public.recap_selections
for each row execute function public.set_updated_at();

alter table public.recap_selections enable row level security;
revoke all on table public.recap_selections from anon;
grant select, insert, update, delete on table public.recap_selections to authenticated;

drop policy if exists "Users can read own recap selections" on public.recap_selections;
create policy "Users can read own recap selections"
  on public.recap_selections for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own recap selections" on public.recap_selections;
create policy "Users can insert own recap selections"
  on public.recap_selections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own recap selections" on public.recap_selections;
create policy "Users can update own recap selections"
  on public.recap_selections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own recap selections" on public.recap_selections;
create policy "Users can delete own recap selections"
  on public.recap_selections for delete
  using (auth.uid() = user_id);
