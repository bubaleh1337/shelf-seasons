# Shelf Seasons: data model

This document describes the intended PostgreSQL model. Migration files remain the executable source of truth once implementation starts.

## 1. Modeling choices

- All personal reading data is user-owned.
- `library_books` stores a user-specific metadata snapshot instead of exposing a mutable shared catalog.
- Every reread creates a new `reading_run`.
- Daily calendar and streaks come from `reading_sessions`.
- Derived statistics are calculated by trusted SQL/functions or server services, not stored as editable counters.
- Use UUID primary keys and `timestamptz` audit timestamps.
- Use `date` for user-local reading dates.

## 2. Enums

Suggested PostgreSQL enums or equivalent checked text domains:

```text
app_locale: en | ru
theme_mode: system | light | dark
book_format: paper | ebook | audiobook | other
library_status: want_to_read | reading | paused | read | dnf | archived
tracking_mode: pages | percent | minutes
run_status: reading | paused | completed | dnf
series_status: planned | in_progress | completed | abandoned
nomination_kind: favorite_candidate | disappointment_candidate
recap_period_type: month | year
recap_category: favorite_book | biggest_disappointment | favorite_cover | favorite_series
book_source: google_books | open_library | manual
```

## 3. Tables

### 3.1 `profiles`

```text
user_id uuid primary key references auth.users(id) on delete cascade
display_name text null
avatar_url text null
locale app_locale not null default 'en'
timezone text not null default 'UTC'
theme theme_mode not null default 'system'
onboarding_completed_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Constraints:

- timezone is validated by trusted application code and, where practical, against PostgreSQL timezone names;
- display name has a reasonable length limit;
- user cannot insert/update another `user_id`.

### 3.2 `library_books`

```text
id uuid primary key
user_id uuid not null references profiles(user_id) on delete cascade
source book_source not null
external_id text null
isbn_10 text null
isbn_13 text null
title text not null
subtitle text null
authors text[] not null
language_code text null
publisher text null
published_date text null
page_count integer null
duration_minutes integer null
format book_format not null
status library_status not null
default_cover_url text null
custom_cover_path text null
description text null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
archived_at timestamptz null
```

Constraints and indexes:

- trimmed title is non-empty;
- authors contains at least one non-empty value or a localized unknown-author marker is represented explicitly by metadata, not an empty array;
- page_count and duration_minutes are positive when present;
- partial unique index on `(user_id, source, external_id)` where external_id is not null;
- indexes on `(user_id, status)`, `(user_id, updated_at desc)`, ISBN fields;
- custom cover path must begin with the current user's UUID path when set.

Do not make ISBN globally unique. Different editions and provider inconsistencies are valid.

### 3.3 `reading_runs`

```text
id uuid primary key
user_id uuid not null references profiles(user_id) on delete cascade
book_id uuid not null references library_books(id) on delete cascade
status run_status not null
tracking_mode tracking_mode not null
started_on date not null
finished_on date null
is_reread boolean not null default false
current_position numeric null
total_units numeric null
rating numeric(2,1) null
impression text null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Constraints:

- rating is null or between 0.5 and 5.0 in 0.5 increments;
- current_position and total_units are non-negative;
- percent tracking never exceeds 100;
- finished_on is required for completed, optional for DNF and null for reading/paused;
- finished_on is not earlier than started_on;
- partial unique index permits only one `reading` or `paused` run per book;
- `user_id` must match the referenced book owner, enforced by trusted function/trigger or composite ownership foreign key.

Historical completed/DNF runs are not reactivated. A reread inserts a new row.

### 3.4 `reading_sessions`

```text
id uuid primary key
user_id uuid not null references profiles(user_id) on delete cascade
run_id uuid not null references reading_runs(id) on delete cascade
read_on date not null
check_in_only boolean not null default false
start_position numeric null
end_position numeric null
pages_read integer null
minutes_read integer null
resulting_percent numeric(5,2) null
note text null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Constraints:

- future local dates are rejected in service logic using the user's current timezone;
- minutes/pages are positive when present;
- resulting_percent is 0–100;
- end_position >= start_position when both exist;
- at least one qualifying field is present: check-in, time, pages or positive movement;
- `user_id` matches run owner;
- indexes on `(user_id, read_on desc)` and `(run_id, read_on)`.

Multiple sessions per run/date are allowed. The UI must make repeated check-in behavior explicit.

### 3.5 `reading_goals`

```text
id uuid primary key
user_id uuid not null references profiles(user_id) on delete cascade
year smallint not null
target_books smallint not null
include_rereads boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(user_id, year)
```

Constraints:

- year within a defensible supported range;
- target_books between 1 and 999.

Progress is computed from completed runs. It is not stored in this table.

### 3.6 `series`

```text
id uuid primary key
user_id uuid not null references profiles(user_id) on delete cascade
name text not null
creator text null
description text null
status series_status not null default 'planned'
cover_book_id uuid null references library_books(id) on delete set null
custom_cover_path text null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

### 3.7 `series_entries`

```text
id uuid primary key
user_id uuid not null references profiles(user_id) on delete cascade
series_id uuid not null references series(id) on delete cascade
book_id uuid null references library_books(id) on delete cascade
placeholder_title text null
sort_order numeric(12,4) not null
position_label text not null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Constraints:

- exactly one of book_id or placeholder_title is present;
- owner matches series and book owner;
- unique `(series_id, sort_order)`;
- duplicate book in the same series is rejected unless a later use case proves it necessary.

Deleting a library book removes only its linked series entry. The series and every other volume remain intact.

Reordering should use a trusted transaction/RPC to avoid temporary unique collisions.

### 3.8 `run_nominations`

```text
id uuid primary key
user_id uuid not null references profiles(user_id) on delete cascade
run_id uuid not null references reading_runs(id) on delete cascade
kind nomination_kind not null
created_at timestamptz not null default now()
unique(run_id)
```

One run cannot be both favorite and disappointment candidate.

### 3.9 `recap_selections`

```text
id uuid primary key
user_id uuid not null references profiles(user_id) on delete cascade
period_type recap_period_type not null
period_start date not null
category recap_category not null
run_id uuid null references reading_runs(id) on delete set null
series_id uuid null references series(id) on delete set null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(user_id, period_type, period_start, category)
```

Category-specific constraints determine whether run_id or series_id is required.

## 4. Storage

Private bucket: `book-covers`.

Object paths:

```text
{user_id}/books/{book_id}/{random_uuid}.webp
{user_id}/series/{series_id}/{random_uuid}.webp
```

Rules:

- only owner can select, insert, update or delete within their prefix;
- signed URLs are generated only for authenticated owner access if bucket remains private;
- original filenames are never trusted as paths;
- remove superseded cover objects after the database update succeeds;
- account deletion removes storage objects through a trusted cleanup flow;
- accepted input: JPEG, PNG, WebP; reject SVG and animation;
- max source size: 5 MB;
- normalize orientation and resize to a maximum around 1200×1800 before storage when implementation supports it safely.

## 5. Derived queries

### 5.1 Qualifying reading days

Return distinct `read_on` values containing at least one valid session. Multiple books or sessions count as one day for streaks.

### 5.2 Current streak

Starting from user's current local date:

- if today qualifies, count backward from today;
- otherwise, if yesterday qualifies, keep that streak current until the end of today in the user's timezone;
- otherwise, current streak is `0`;
- count consecutive qualifying dates backward.

This rule must be consistent in UI, tests and SQL/service code.

### 5.3 Longest streak

Sort qualifying dates and group consecutive islands. Return the maximum length. Use date arithmetic, not 24-hour timestamp differences.

### 5.4 Goal progress

Count completed runs with `finished_on` inside the selected local calendar year. If `include_rereads = false`, exclude rows where `is_reread = true`.

### 5.5 Series progress

Count entries linked to books with at least one completed reading run divided by total real-book entries. Placeholders remain visible and may count toward the denominator only when the user explicitly set the intended series length; the MVP default is to count all entries, including placeholders.

## 6. RLS policy model

For every personal table:

```text
select: auth.uid() = user_id
insert: auth.uid() = user_id
update: auth.uid() = user_id using + with check
delete: auth.uid() = user_id
```

This simple predicate is necessary but not sufficient for cross-table ownership. Composite foreign keys, trusted triggers or security-definer RPCs with fixed `search_path` must enforce that child references belong to the same user.

Security-definer functions:

- use explicit schema-qualified objects;
- set a safe `search_path`;
- revoke public execute by default;
- grant only to intended authenticated role;
- derive user from `auth.uid()`, never a caller-provided owner ID.

## 7. Mutations requiring transactions

- start reading run and update visible library status;
- pause/resume/complete/DNF run and synchronize status;
- save detailed session and update current position;
- reorder a series;
- replace/delete custom cover metadata plus cleanup scheduling;
- delete account and storage cleanup coordination.

## 8. Migration rules

- timestamped, ordered SQL files;
- migrations are forward-only after production use;
- no manual production-only schema changes;
- every migration is tested from an empty database;
- destructive changes require backup and restore rehearsal;
- generated TypeScript database types are committed after migration;
- schema and RLS tests change in the same commit as the migration.

## 9. Data export

Authenticated JSON export includes:

- profile/preferences except provider secrets;
- library books and personal metadata;
- reading runs and sessions;
- goals;
- series and entries;
- nominations and recap selections;
- stable schema version and export timestamp.

Custom cover images may be packaged later. MVP export includes references and an explicit note if image bytes are not included; public release copy must not imply otherwise.
