# Shelf Seasons 0.19.2

This patch removes remote provider cover work from the critical book-save path.

## Included

- adding a Google Books/Open Library result no longer waits for the provider image to be downloaded, converted with Sharp and uploaded to Storage;
- editing a book is no longer blocked by remote cover failures;
- custom uploaded covers remain validated and stored synchronously;
- the existing cover-repair endpoint runs in the background after a successful save;
- imported books keep their provider identity during metadata edits.

## Manual setup

No Supabase migration and no new environment variable are required.
