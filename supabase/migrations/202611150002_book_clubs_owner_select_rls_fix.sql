begin;

-- INSERT ... RETURNING checks the SELECT policy before the owner-membership
-- AFTER INSERT trigger can make the new club visible through membership.
-- Keep membership access for invitees, but let the owner read their own club
-- immediately. Do not grant access to any private library or reading rows.
alter policy book_clubs_select_members
  on public.book_clubs
  using (
    owner_id = (select auth.uid())
    or id in (select private.club_ids_for_user())
  );

commit;
