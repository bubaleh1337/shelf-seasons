begin;
select plan(8);

insert into auth.users (id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000501', 'authenticated', 'authenticated', 'status-one@example.test', '', now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000502', 'authenticated', 'authenticated', 'status-two@example.test', '', now(), now(), '{}', '{}');

insert into public.library_books (id, user_id, title, page_count, status) values
  ('00000000-0000-0000-0000-000000005001', '00000000-0000-0000-0000-000000000501', 'Own status book', 300, 'want'),
  ('00000000-0000-0000-0000-000000005002', '00000000-0000-0000-0000-000000000502', 'Other status book', 200, 'want');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.set_library_book_status('00000000-0000-0000-0000-000000005001', 'reading', current_date)$$,
  'a user can start their own book'
);
select is((select status::text from public.library_books where id = '00000000-0000-0000-0000-000000005001'), 'reading', 'the library shelf becomes reading');
select is((select status::text from public.reading_runs where book_id = '00000000-0000-0000-0000-000000005001'), 'reading', 'an active run is created');

select lives_ok(
  $$select public.set_library_book_status('00000000-0000-0000-0000-000000005001', 'read', current_date)$$,
  'a user can mark their own book as read'
);
select is((select status::text from public.library_books where id = '00000000-0000-0000-0000-000000005001'), 'read', 'the library shelf becomes read');
select is((select status::text from public.reading_runs where book_id = '00000000-0000-0000-0000-000000005001'), 'completed', 'the active run is completed');
select isnt((select finished_on from public.reading_runs where book_id = '00000000-0000-0000-0000-000000005001'), null::date, 'the completed run has a finish date');

select throws_ok(
  $$select public.set_library_book_status('00000000-0000-0000-0000-000000005002', 'reading', current_date)$$,
  'P0002',
  'book_not_found',
  'a user cannot change another account book'
);

select * from finish();
rollback;
