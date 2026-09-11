Shelf Seasons 0.19.3 — final hardening of book save

Apply over the 0.19.2 local project.

Changes:
- book-write limiter infrastructure errors no longer block saving; real 429 limits remain;
- specific RU/EN save errors;
- dedicated regression test for search -> choose -> Read -> Save;
- safe custom-cover removal order;
- no SQL migration.

Windows steps:
1. Stop npm run dev (Ctrl+C).
2. Copy the CONTENTS of this archive into P:\Projects\shelf-seasons\shelf-seasons and replace matching files.
3. Run .\APPLY_FIX_0.19.3.ps1
4. Do not deploy if any verification command fails.
5. Start npm run dev and test the critical book-save flow.
