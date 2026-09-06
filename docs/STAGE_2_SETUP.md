# Stage 2 development setup

This checklist connects the verified local app to a **development-only** Supabase project. The production project remains separate and untouched.

## 1. Create the development project

- Supabase project name: `shelf-seasons-dev`
- Save its database password in your password manager, not in the repository.
- Open **Connect** and copy the Project URL and Publishable key.

In Windows PowerShell:

```powershell
Set-Location P:\Projects\shelf-seasons
Copy-Item .env.example .env.local
notepad .env.local
```

Fill only:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

The publishable key is designed for the browser. RLS remains the database security boundary. Never add a service-role or secret key to this app.

## 2. Apply the migration

In the Supabase SQL editor, run the complete contents of:

```text
supabase/migrations/202609050001_stage_2_profiles.sql
```

The migration creates `profiles`, `reading_goals`, the new-user trigger, atomic onboarding function and ownership policies. Avoid recreating any of these objects manually in the dashboard.

## 3. Configure Google OAuth

In Google Auth Platform create a **Web application** OAuth client.

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: copy the exact callback shown on the Supabase Google provider page; it has the form `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.

In Supabase **Authentication → Providers → Google**, enable Google and paste the Google Client ID and Client Secret.

In Supabase **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

For the Vercel beta, replace Site URL with `https://shelf-seasons.vercel.app` and keep both production and localhost callback URLs in the Redirect URLs list.

The application callback only restores paths under the selected locale's `/app` route. External and protocol-relative return paths are rejected.

## 4. Verify locally

Restart the server after editing `.env.local`:

```powershell
npm run dev
```

Open `http://localhost:3000/ru/sign-in` and verify:

1. Google sign-in returns to Shelf Seasons.
2. The first login opens onboarding.
3. Timezone is detected automatically and can be corrected.
4. Saving opens the protected app.
5. Settings → Account → Sign out returns to sign-in.
6. Opening `/ru/app` after sign-out redirects to `/ru/sign-in`.

## 5. Run database policy tests

When Docker Desktop and Supabase CLI are available:

```powershell
npx supabase start
npx supabase db reset
npx supabase test db
```

The executable policy test is `supabase/tests/database/stage_2_rls.test.sql`. A connected Stage 2 environment is not considered complete until this test passes against a fresh local database.

## Production boundary

Create `shelf-seasons-prod` only when the development flow is verified and a production deployment is explicitly approved. Use separate Google OAuth credentials, URLs and Supabase keys for production.
