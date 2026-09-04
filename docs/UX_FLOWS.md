# Shelf Seasons: UX flows and screen map

## 1. Experience principles

1. The fastest meaningful action is always visible.
2. Logging reading must not feel like bookkeeping.
3. Empty states explain the next useful action.
4. Destructive or irreversible actions require explicit confirmation.
5. Calendar and recap visuals use real covers, but text remains readable when covers are missing.
6. Every flow works in English and Russian without truncation.

## 2. Information architecture

### Public

- `/[locale]` — landing page
- `/[locale]/privacy` — privacy policy
- `/[locale]/terms` — terms of use
- `/[locale]/auth/callback` — OAuth callback
- `/[locale]/auth/error` — recoverable authentication error

### Authenticated

- `/[locale]/app` — Home
- `/[locale]/app/library` — Library
- `/[locale]/app/library/add` — Search and add
- `/[locale]/app/books/[bookId]` — Book details
- `/[locale]/app/calendar` — Week/month/year calendar
- `/[locale]/app/series` — Series library
- `/[locale]/app/series/[seriesId]` — Series details
- `/[locale]/app/recaps/[period]` — Monthly/yearly recap
- `/[locale]/app/settings` — Profile, language, timezone and data controls

## 3. Navigation

### Mobile

Bottom navigation:

1. Home
2. Library
3. Calendar
4. Series
5. More/Profile

Primary floating action: `Log reading` / `Отметить чтение`.

The floating action opens a book selector if multiple books are active. If exactly one book is active, that book is preselected. If none are active, the user is offered `Start a book`.

### Desktop

Left sidebar:

- Shelf Seasons logo/wordmark
- Home
- Library
- Calendar
- Series
- Recaps
- Settings
- primary `Log reading` button

The main content width is capped. Dense library grids may use a wider content mode than text-heavy settings pages.

## 4. Screen specifications

### 4.1 Landing

Purpose: explain the product in under one screen and lead to Google sign-in.

Required sections:

- brand and localized tagline;
- hero mockup showing a cover calendar;
- three benefits: personal shelf, daily reading mosaic, seasonal recaps;
- Google sign-in CTA;
- privacy/terms/footer;
- language selector.

No invented user counts, ratings or testimonials.

### 4.2 Onboarding

Step 1 — locale/timezone:

- locale preselected from route/browser;
- timezone preselected from browser IANA timezone;
- user can correct both.

Step 2 — annual goal:

- year defaults to current local year;
- suggested values may be shown, but no manipulative default;
- `Skip for now` is available.

Step 3 — first book:

- `Find a book`;
- `Add manually`;
- `Explore with sample data` only if sample data is clearly temporary and never mixed into the real library.

Completion routes to Home.

### 4.3 Home

States:

1. No books — show one primary add-book action.
2. Books but no active run — show `Choose your next book`.
3. One active run — show large current-book card and one-tap check-in.
4. Multiple active runs — carousel/stack with an explicit selected book.

Home cards:

- Current reading
- Annual goal
- Current and longest streak
- Last seven local days
- Recently completed
- Series in progress
- Current month recap

Check-in success appears next to the button and updates calendar/streak without requiring a scroll.

### 4.4 Library

Header:

- title and item count;
- search;
- filters;
- grid/list toggle;
- Add book.

Grid card:

- cover;
- title and author available to assistive tech;
- status badge outside critical cover artwork;
- progress indicator only for active reading.

Quick actions must not be hidden behind hover only.

### 4.5 Search and add

Flow:

1. Enter title/author/ISBN.
2. Wait for a debounced request or explicitly submit.
3. See normalized results with edition-identifying data.
4. Select result.
5. Review/edit personal fields and choose shelf status.
6. Save.
7. Show success with `Open book` and `Add another`.

Search must support an empty result state and API failure state. The manual-add action remains available in both.

### 4.6 Manual add

Required:

- title;
- at least one author or explicit `Unknown author` choice;
- format;
- initial shelf status.

Optional:

- subtitle;
- ISBN;
- language;
- publication date;
- pages/duration;
- custom cover;
- series assignment.

### 4.7 Book details

Sections:

- cover and metadata;
- current status/progress;
- primary contextual action;
- reading history with separate runs;
- daily sessions;
- rating/review for each completed run;
- series membership;
- edit personal metadata;
- archive/delete controls.

Delete behavior:

- if there is no history, allow deletion after confirmation;
- if history exists, recommend Archive and explain that delete removes sessions and recap references;
- destructive confirmation names the book.

### 4.8 Log reading modal

Default fast mode:

- selected active book;
- local date, default today;
- `Log today's reading` confirmation.

Expandable details:

- start/end page or new position;
- percentage;
- minutes;
- note.

After save:

- show saved state in the same modal;
- update visible goal/streak/calendar data;
- offer `Edit entry` rather than silently creating duplicates.

### 4.9 Calendar

Header:

- previous/next period;
- Today;
- Week/Month/Year toggle;
- summary: reading days, books and optional time/pages.

Month day selection opens:

- every book read that day;
- sessions and progress;
- edit/delete controls for owned entries;
- add another session.

Year mosaic uses 12 month groups rather than one unreadably dense grid on mobile.

### 4.10 Series

List card:

- series cover;
- name;
- progress `4 of 7`;
- next unread book;
- status.

Series details:

- ordered volumes;
- placeholders for unadded volumes;
- completed/current/wanted visual states;
- reorder controls;
- `Start next book` action.

### 4.11 Complete reading

Flow:

1. Select finish date.
2. Review final progress.
3. Add optional rating and short impression.
4. Optionally choose one nomination.
5. Confirm.
6. Show calm celebration, updated goal and next useful choices.

Choices after completion:

- open updated monthly recap;
- choose next series book;
- return Home.

No confetti if reduced motion is enabled.

### 4.12 Recaps

Monthly recap sections:

- cover mosaic;
- completed books;
- reading days;
- streak;
- pages/time when available;
- series progress;
- favorite/disappointment selections.

Yearly recap adds:

- goal outcome;
- month comparison;
- top months;
- all completed covers;
- rereads and unique books;
- final personal selections.

Incomplete statistics are labelled, for example `Based on sessions with time recorded`, rather than pretending to be totals.

### 4.13 Settings

- profile preview;
- locale;
- timezone;
- theme: System, Light, Dark;
- annual goal settings;
- JSON export;
- privacy and terms;
- logout;
- delete account.

Locale changes navigate to the equivalent localized route and persist to profile. Timezone changes show a warning that calendar grouping and streaks may change.

## 5. Critical user journeys

### Journey A: first useful moment

Google sign-in → onboarding → search book → add as Reading → Home current-book card → Log today's reading → cover appears in today cell.

### Journey B: finish and remember

Open current book → Complete book → finish date/rating/impression → nominate → annual goal increments → monthly recap updates.

### Journey C: reread

Open previously completed book → Read again → new run created → log sessions → complete → old run remains immutable history → goal follows include-rereads setting.

### Journey D: series

Create series → add ordered books/placeholders → complete current volume → series progress updates → start next unread volume.

### Journey E: backdated logging

Calendar → select past date → add session → date validated in profile timezone → streak and recap recomputed → updated result shown.

## 6. Error and recovery states

Every mutation must provide:

- pending state that prevents accidental duplicate submit;
- success state near the action;
- recoverable error with retry;
- preserved user input when safe;
- no optimistic success if the database rejected the write.

Special cases:

- book provider unavailable: manual entry remains usable;
- cover unavailable: placeholder, not broken image;
- expired session: return to sign-in and preserve a safe return URL;
- offline mutation: do not claim saved;
- timezone invalid: fall back to UTC temporarily and request correction;
- translated string missing: fail tests; never display a raw translation key in production.
