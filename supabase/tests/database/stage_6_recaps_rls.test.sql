begin;
select plan(6);

insert into auth.users (id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000601', 'authenticated', 'authenticated', 'recap-one@example.test', '', now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000602', 'authenticated', 'authenticated', 'recap-two@example.test', '', now(), now(), '{}', '{}');

insert into public.library_books (id, user_id, title, status) values
  ('00000000-0000-0000-0000-000000006001', '00000000-0000-0000-0000-000000000601', 'Own completed book', 'read'),
  ('00000000-0000-0000-0000-000000006002', '00000000-0000-0000-0000-000000000602', 'Other completed book', 'read');

insert into public.reading_runs (id, user_id, book_id, status, started_on, finished_on) values
  ('00000000-0000-0000-0000-000000006101', '00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000006001', 'completed', '2026-09-01', '2026-09-06'),
  ('00000000-0000-0000-0000-000000006102', '00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000006001', 'completed', '2026-08-01', '2026-08-06'),
  ('00000000-0000-0000-0000-000000006103', '00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000006002', 'completed', '2026-09-01', '2026-09-06');

insert into public.series (id, user_id, name) values
  ('00000000-0000-0000-0000-000000006201', '00000000-0000-0000-0000-000000000601', 'Own progressed series');
insert into public.series_entries (id, user_id, series_id, book_id, sort_order, position_label) values
  ('00000000-0000-0000-0000-000000006301', '00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000006201', '00000000-0000-0000-0000-000000006001', 1000, '1');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select count(*) from public.recap_selections), 0::bigint, 'a new user starts with no recap selections');
select lives_ok(
  $$insert into public.recap_selections (user_id, period_type, period_start, category, run_id) values ('00000000-0000-0000-0000-000000000601', 'month', '2026-09-01', 'favorite_book', '00000000-0000-0000-0000-000000006101')$$,
  'a user can select an eligible completed run'
);
select throws_ok(
  $$insert into public.recap_selections (user_id, period_type, period_start, category, run_id) values ('00000000-0000-0000-0000-000000000601', 'month', '2026-09-01', 'favorite_cover', '00000000-0000-0000-0000-000000006102')$$,
  '23514',
  'run_not_eligible_for_recap',
  'a run outside the period is rejected'
);
select throws_ok(
  $$insert into public.recap_selections (user_id, period_type, period_start, category, run_id) values ('00000000-0000-0000-0000-000000000601', 'month', '2026-09-02', 'biggest_disappointment', '00000000-0000-0000-0000-000000006101')$$,
  '23514',
  null,
  'a noncanonical period start is rejected'
);
select lives_ok(
  $$insert into public.recap_selections (user_id, period_type, period_start, category, series_id) values ('00000000-0000-0000-0000-000000000601', 'month', '2026-09-01', 'favorite_series', '00000000-0000-0000-0000-000000006201')$$,
  'a progressed series is eligible'
);
select is((select count(*) from public.recap_selections), 2::bigint, 'a user reads only own saved selections');

select * from finish();
rollback;
