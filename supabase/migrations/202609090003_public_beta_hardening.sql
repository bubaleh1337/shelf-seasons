begin;

create table if not exists public.request_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket),
  constraint request_rate_limits_bucket_check check (
    bucket in ('book-search', 'book-write', 'cover-repair')
  )
);

alter table public.request_rate_limits enable row level security;
alter table public.request_rate_limits force row level security;

revoke all on table public.request_rate_limits from public, anon, authenticated;

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_time timestamptz := statement_timestamp();
  current_count integer;
  current_window timestamptz;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_bucket not in ('book-search', 'book-write', 'cover-repair') then
    raise exception 'invalid_rate_limit_bucket' using errcode = '22023';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400
    or p_max_requests < 1 or p_max_requests > 1000 then
    raise exception 'invalid_rate_limit_configuration' using errcode = '22023';
  end if;

  insert into public.request_rate_limits as limits (
    user_id, bucket, window_started_at, request_count, updated_at
  ) values (
    current_user_id, p_bucket, current_time, 1, current_time
  )
  on conflict (user_id, bucket) do update set
    window_started_at = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= current_time
        then current_time
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= current_time
        then 1
      else limits.request_count + 1
    end,
    updated_at = current_time
  returning limits.request_count, limits.window_started_at
  into current_count, current_window;

  allowed := current_count <= p_max_requests;
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(extract(epoch from (
        current_window + make_interval(secs => p_window_seconds) - current_time
      )))::integer
    )
  end;
  return next;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_rate_limit(text, integer, integer) to authenticated;

commit;
