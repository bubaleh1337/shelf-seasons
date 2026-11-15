# Clubs domain

The first clubs release keeps all personal books, sessions and notes private. Only a member-initiated link from one local edition to one club read publishes their read progress into `book_club_progress`. The snapshot is maintained by PostgreSQL triggers on personal `reading_runs`; no cross-account access to those runs is granted. The club's book title and author are a separate immutable snapshot.

Club creation and joining use the account-bound user ID returned by Supabase Auth. A high-entropy invite token allows up to 50 members; `join_book_club` is a narrowly scoped security-definer RPC with a fixed search path and authentication checks. Invites are intentionally shared among members. Deleting a club cascades club-specific records only. The first release has no discussion or chat.
