# Book clubs — first functional slice

## Scope

- A reader may create a private club and copy a high-entropy invitation link.
- Other signed-in readers may join with the invite link/code (up to 50 members).
- Club owners may select an existing personal library book to start one shared read with an optional target date.
- All members see the shared book and the names of fellow club members.
- The organizer chooses an already-owned book. Other members see a prompt to add an independently editable copy using the standard book editor. A single exact match can be linked with one click; there is no arbitrary personal-library dropdown.
- After linking, new entries in their ordinary reading journal update a separate club-only progress snapshot automatically. An open club view refreshes while visible approximately every 30 seconds. Only percentage, page position (where available), and completion status are shared.
- An owner may finish the club read, keeping it in club history and enabling a new active read.
- Personal reviews, impressions, private cover uploads, personal descriptions, seasonal shelves, reading session notes, and reading streaks never become visible to club members. Club read snapshots contain only public-safe edition metadata; personal copies remain independently editable.
- Display names are edited in Settings and synchronized to existing club memberships, without changing account identity.
- Both locales are supported, including mobile navigation under **More** for secondary sections.

## Changing the club-selected book

- The organizer can replace an active club read with another personally owned book.
- A confirmation explains that the previous read is marked `replaced`, not `finished`.
- Replacement is an atomic, owner-authorized PostgreSQL RPC under a row lock.
- Existing club progress snapshots for the old read remain historical and stop syncing.
- Every member independently connects or adds their edition of the new book; nobody's private library, reading runs or reading sessions are deleted.
- Replacing a book does not count as finishing it; the club history distinguishes `replaced` from `finished`.
- The replacement migration must be applied **before** deploying the new endpoint.

## Implementation

Forward migrations: `supabase/migrations/202611150001_book_clubs.sql`, `202611150002_book_clubs_owner_select_rls_fix.sql`, and `202611150003_club_book_template_profile_names.sql` in order. Deploy only to the development Supabase project, validate RLS with separate user accounts, then explicitly approve production rollout.

The new database objects use `private.club_ids_for_user` to avoid recursive RLS policies, while `public.join_book_club` limits privileged work to looking up a high-entropy invite token and inserting `auth.uid()` into the membership table. This function intentionally returns no private reading data.

## Test plan (development only)

1. Create a club as A and copy its link.
2. Open link in account B, join and verify both names appear.
3. Ensure account C cannot list the club without an invite, nor insert a read or progress for it.
4. Have A select a personal book for club reading. Ensure B cannot finish the reading.
5. Have B link their own edition; log a reading session as B and verify percentage/page updates for A without revealing B's private notes.
6. Finish B's reading, verify 100% in the club. Have the owner close the club read and start another.
7. Unlink by deleting the personal book or leave the club; ensure historical personal records remain untouched.
8. Test both locales and both themes at 320 px, 768 px and desktop width; test an expired session and an invalid invitation.

Future iterations: moderated discussions, optional spoiler thresholds, reminders, polls, and additional privacy controls. None are included in this update.
