begin;
select plan(7);

insert into auth.users (id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000401', 'authenticated', 'authenticated', 'reader-one@example.test', '', now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000402', 'authenticated', 'authenticated', 'reader-two@example.test', '', now(), now(), '{}', '{}');

insert into public.library_books (id, user_id, title, page_count) values
  ('00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000000401', 'Own reading book', 300),
  ('00000000-0000-0000-0000-000000004002', '00000000-0000-0000-0000-000000000402', 'Other reading book', 200);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.log_reading_session('00000000-0000-0000-0000-000000004001', current_date, true, null, null, null, null)$$,
  'a user can log a quick check-in for their own book'
);
select is((select count(*) from public.reading_runs), 1::bigint, 'logging creates one active run');
select is((select count(*) from public.reading_sessions), 1::bigint, 'logging creates one session');
select is((select status::text from public.library_books where id = '00000000-0000-0000-0000-000000004001'), 'reading', 'logging synchronizes the library status');
select lives_ok(
  $$select public.log_reading_session('00000000-0000-0000-0000-000000004001', current_date, true, null, null, null, null)$$,
  'repeating a quick check-in is idempotent'
);
select is((select count(*) from public.reading_sessions), 1::bigint, 'an idempotent retry does not create a duplicate');
select throws_ok(
  $$select public.log_reading_session('00000000-0000-0000-0000-000000004002', current_date, true, null, null, null, null)$$,
  'P0002',
  'book_not_found',
  'a user cannot log reading for another account book'
);

select * from finish();
rollback;
