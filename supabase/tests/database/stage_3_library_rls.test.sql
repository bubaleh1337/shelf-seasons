begin;
select plan(5);

insert into auth.users (id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000301', 'authenticated', 'authenticated', 'library-one@example.test', '', now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000302', 'authenticated', 'authenticated', 'library-two@example.test', '', now(), now(), '{}', '{}');

insert into public.library_books (user_id, title) values
  ('00000000-0000-0000-0000-000000000301', 'Own book'),
  ('00000000-0000-0000-0000-000000000302', 'Other book');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000301', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq('select title from public.library_books', $$values ('Own book'::text)$$, 'a user reads only their own books');
select lives_ok($$update public.library_books set status = 'reading' where title = 'Own book'$$, 'a user updates their own book');
select is((select status::text from public.library_books where title = 'Own book'), 'reading', 'the own update is visible');
select throws_ok($$insert into public.library_books (user_id, title) values ('00000000-0000-0000-0000-000000000302', 'Forbidden')$$, '42501', null, 'a user cannot create another account book');

reset role;
select is((select public from storage.buckets where id = 'book-covers'), false, 'the cover bucket is private');

select * from finish();
rollback;
