begin;
select plan(6);

insert into auth.users (id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000501', 'authenticated', 'authenticated', 'series-one@example.test', '', now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000502', 'authenticated', 'authenticated', 'series-two@example.test', '', now(), now(), '{}', '{}');

insert into public.library_books (id, user_id, title) values
  ('00000000-0000-0000-0000-000000005001', '00000000-0000-0000-0000-000000000501', 'Own volume'),
  ('00000000-0000-0000-0000-000000005002', '00000000-0000-0000-0000-000000000502', 'Other volume');

insert into public.series (id, user_id, name) values
  ('00000000-0000-0000-0000-000000005101', '00000000-0000-0000-0000-000000000501', 'Own series'),
  ('00000000-0000-0000-0000-000000005102', '00000000-0000-0000-0000-000000000502', 'Other series');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000501', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select count(*) from public.series), 1::bigint, 'a user reads only own series');
select lives_ok(
  $$insert into public.series_entries (id, user_id, series_id, book_id, sort_order, position_label) values ('00000000-0000-0000-0000-000000005201', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000005101', '00000000-0000-0000-0000-000000005001', 1000, '1')$$,
  'a user can add an owned book to an owned series'
);
select throws_ok(
  $$insert into public.series_entries (user_id, series_id, book_id, sort_order, position_label) values ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000005101', '00000000-0000-0000-0000-000000005002', 2000, '2')$$,
  '23503',
  'insert or update on table "series_entries" violates foreign key constraint "series_entries_book_owner_fkey"',
  'a user cannot attach another account book'
);
select throws_ok(
  $$insert into public.series_entries (user_id, series_id, sort_order, position_label) values ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000005101', 3000, '3')$$,
  '23514',
  null,
  'an entry must reference a book or a placeholder'
);
select lives_ok(
  $$insert into public.series_entries (id, user_id, series_id, placeholder_title, sort_order, position_label) values ('00000000-0000-0000-0000-000000005202', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000005101', 'Future volume', 2000, '2')$$,
  'a placeholder volume is supported'
);
select lives_ok(
  $$select public.reorder_series_entries('00000000-0000-0000-0000-000000005101', array['00000000-0000-0000-0000-000000005202'::uuid, '00000000-0000-0000-0000-000000005201'::uuid])$$,
  'a user can reorder the complete owned entry set'
);

select * from finish();
rollback;
