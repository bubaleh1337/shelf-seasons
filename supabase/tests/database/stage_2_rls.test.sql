begin;
select plan(8);

insert into auth.users (
  id, aud, role, email, encrypted_password, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  ('00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'one@example.test', '', now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000202', 'authenticated', 'authenticated', 'two@example.test', '', now(), now(), '{}', '{}');

insert into public.reading_goals (user_id, year, target_books) values
  ('00000000-0000-0000-0000-000000000101', 2026, 24),
  ('00000000-0000-0000-0000-000000000202', 2026, 36);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  'select user_id from public.profiles order by user_id',
  $$values ('00000000-0000-0000-0000-000000000101'::uuid)$$,
  'a user can read only their own profile'
);

select results_eq(
  'select target_books from public.reading_goals order by target_books',
  'values (24::smallint)',
  'a user can read only their own goal'
);

select lives_ok(
  $$update public.profiles set timezone = 'Europe/Paris' where user_id = '00000000-0000-0000-0000-000000000101'$$,
  'a user can update their own profile'
);

select is(
  (select timezone from public.profiles where user_id = '00000000-0000-0000-0000-000000000101'),
  'Europe/Paris',
  'the own-profile update is visible'
);

select lives_ok(
  $$update public.profiles set timezone = 'UTC' where user_id = '00000000-0000-0000-0000-000000000202'$$,
  'an update targeting another profile exposes no row'
);

reset role;
select is(
  (select timezone from public.profiles where user_id = '00000000-0000-0000-0000-000000000202'),
  'UTC',
  'the other profile remains unchanged'
);

set local role authenticated;
select throws_ok(
  $$insert into public.reading_goals (user_id, year, target_books) values ('00000000-0000-0000-0000-000000000202', 2027, 12)$$,
  '42501',
  null,
  'a user cannot insert a goal for another account'
);

select lives_ok(
  $$select public.complete_onboarding('ru', 'Europe/Moscow', 'dark', 30)$$,
  'onboarding updates the authenticated account atomically'
);

select * from finish();
rollback;
