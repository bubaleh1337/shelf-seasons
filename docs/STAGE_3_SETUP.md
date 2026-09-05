# Stage 3 setup — personal library

Version 0.4.0 adds the first real user-owned feature. Authenticated accounts no longer see the fictional demo shelf.

## Apply once in the development Supabase project

Open **SQL Editor → New query**, paste the complete contents of:

`supabase/migrations/202609050002_personal_library.sql`

Run it once. It creates the private `library_books` table, ownership policies and the private `book-covers` storage bucket.

Do not paste a database password or Google client secret into this project. The local app needs only the existing project URL and publishable key in `.env.local`.

## Verify on Windows

```powershell
Set-Location P:\Projects\shelf-seasons
npm ci
npm run test:connected
npm run dev
```

Open `http://localhost:3000/ru/app/library`, sign in, and test add, edit, archive and delete with the same account. A second account must see an empty independent library.
