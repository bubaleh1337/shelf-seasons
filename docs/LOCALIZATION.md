# Shelf Seasons: localization contract

This document defines localization as product architecture, not a later translation task.

## 1. Brand invariant

The brand is always **Shelf Seasons**.

| Surface | Value |
| --- | --- |
| Product name | `Shelf Seasons` |
| Repository | `shelf-seasons` |
| Package name | `shelf-seasons` |
| Vercel project | `shelf-seasons` |
| Supabase projects | `shelf-seasons-dev`, `shelf-seasons-prod` |
| Preferred domain | `shelfseasons.app` |
| Future native app identifier | `app.shelfseasons` |
| English title | `Shelf Seasons — Reading Journal` |
| Russian title | `Shelf Seasons — Дневник чтения` |

Do not introduce `shelf-seasons-ru`, a translated brand, or a language-specific repository.

## 2. Supported locales

MVP locales:

- `en` — default fallback;
- `ru` — complete first-class locale.

Architecture must allow adding another locale without changing routes, database tables or components.

## 3. Locale resolution

For an anonymous first visit:

1. use the locale in the URL when present;
2. otherwise use a previously stored explicit choice;
3. otherwise choose `ru` if the browser's preferred language starts with `ru`;
4. otherwise choose `en`.

After sign-in, `profiles.locale` is authoritative. A user can change it in Settings. Changing locale preserves the current route when possible.

Canonical application routes are locale-prefixed: `/en/...` and `/ru/...`. Authentication callbacks must safely restore the locale.

## 4. Translation structure

Use namespaced message files:

```text
messages/
  en.json
  ru.json
```

Recommended namespaces:

- `common`
- `navigation`
- `auth`
- `onboarding`
- `home`
- `library`
- `book`
- `reading`
- `calendar`
- `series`
- `recaps`
- `settings`
- `validation`
- `errors`
- `metadata`

Components receive translation keys or already formatted strings. Do not use English or Russian literals inside reusable UI components.

## 5. Core terminology

| Key/concept | English | Russian |
| --- | --- | --- |
| Library | Library | Библиотека |
| Calendar | Calendar | Календарь |
| Series | Series | Серии |
| Recaps | Recaps | Итоги |
| Want to read | Want to read | Хочу прочитать |
| Reading | Reading | Читаю |
| Read | Read | Прочитано |
| Paused | Paused | Отложено |
| Did not finish | Did not finish | Не дочитано |
| Log today's reading | Log today's reading | Отметить чтение сегодня |
| Add book | Add book | Добавить книгу |
| Reading goal | Reading goal | Цель по чтению |
| Current streak | Current streak | Текущая серия |
| Longest streak | Longest streak | Лучшая серия |
| Monthly recap | Monthly recap | Итоги месяца |
| Yearly recap | Yearly recap | Итоги года |

Russian UI copy must be gender-neutral. Avoid phrases that force grammatical gender; prefer action nouns and infinitives such as `Отметить чтение` and `Завершить книгу`.

## 6. Formatting rules

- Use `Intl.DateTimeFormat`, `Intl.NumberFormat` and ICU plurals.
- Store timestamps in UTC; interpret calendar days in the user's IANA timezone.
- Week starts on Monday for `ru`. For `en`, use the selected regional convention or an explicit user preference when added.
- Never concatenate translated fragments to form a sentence.
- Do not hard-code plural endings. Test `1`, `2`, `5`, `11`, `21`, and `0` in Russian.
- Book titles, author names, notes and series names are user/provider data and are not machine-translated.
- Sort and search user-facing strings with locale-aware collation where practical.

## 7. Metadata and URLs

Each locale has translated page titles, descriptions, Open Graph text and error pages. The product name and canonical domain remain unchanged.

For public marketing pages, output locale alternates. Private app pages must not be indexed.

## 8. Layout resilience

The interface must tolerate at least 35% text expansion without overlap. Buttons may wrap to two lines when necessary; icon-only actions require localized accessible names.

Test at minimum:

- 320 px mobile viewport;
- 200% zoom;
- longest Russian navigation and validation strings;
- empty, loading, error and success states in both locales;
- screen-reader labels in both locales.

## 9. Localization quality gate

CI fails when:

- a key exists in one MVP locale but not the other;
- a component displays a raw translation key;
- an untranslated UI literal is introduced outside an approved allow-list;
- ICU syntax is invalid;
- locale route tests or authentication callback locale restoration fail.

Every feature PR adds English and Russian copy in the same change.
