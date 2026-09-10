# Shelf Seasons 0.18.0

This release makes yearly-goal totals explainable and restores a fast fallback
for Russian translated-title searches.

## Included

- the yearly goal opens a list of every counted reading run with its title,
  completion date and reread label;
- accidental duplicate rereads can be removed individually without deleting
  the original completed read or its library book;
- goal copy consistently says completed reads instead of implying that the
  number equals the current library size;
- `Игра престолов` immediately expands to `A Game of Thrones` and can use Open
  Library when Google Books is out of quota;
- slow provider and translation calls have short, parallel request budgets;
- rate-limit and temporary-provider failures have separate Russian and English
  messages while manual entry remains available.

## Manual setup

No database migration is required. A dedicated `GOOGLE_BOOKS_API_KEY` in Vercel
is still recommended for broad production search coverage, but the new fallback
does not require it for the reported `Игра престолов` query.
