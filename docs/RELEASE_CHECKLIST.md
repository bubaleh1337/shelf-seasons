# Shelf Seasons: release checklist

Complete every applicable item before public production release. Record evidence or a link next to each checked item in the working copy.

## Brand and product

- [ ] Product name is `Shelf Seasons` in UI, metadata, emails and policies.
- [ ] Repository, package, hosting and environment names use `shelf-seasons`.
- [ ] English and Russian descriptors are correct; the brand itself is not translated.
- [ ] MVP scope and known limitations are documented honestly.
- [ ] Domain availability and trademark risk were rechecked immediately before purchase or public launch.

## Core journeys

- [ ] New user can sign in, complete onboarding and reach Home.
- [ ] User can search for a book, add it, edit it and remove it.
- [ ] Manual entry works while book providers are unavailable.
- [ ] Custom cover upload, replace and delete work.
- [ ] User can start, pause, resume, finish and reread a book.
- [ ] Quick daily check-in works and prevents accidental duplicate submission.
- [ ] Backdated sessions work within documented rules.
- [ ] Calendar, goals, series, nominations and recaps recompute after edits.
- [ ] Export and account deletion work end to end.

## Localization

- [ ] English and Russian message-key parity test passes.
- [ ] No raw translation keys or unapproved hard-coded UI strings appear.
- [ ] Russian copy is gender-neutral.
- [ ] Dates, numbers and plurals are locale-correct.
- [ ] Locale is restored after OAuth callback and page refresh.
- [ ] Layout survives Russian expansion at 320 px and 200% zoom.
- [ ] Metadata, errors, empty states and email copy are localized.

## Accessibility and visual quality

- [ ] Keyboard-only navigation completes critical journeys.
- [ ] Focus indicators are visible in light and dark themes.
- [ ] Screen-reader names, headings, landmarks and live regions are verified.
- [ ] Calendar has a usable non-visual/list representation.
- [ ] Color contrast meets WCAG 2.2 AA for normal text and controls.
- [ ] Status is never communicated by color alone.
- [ ] Reduced-motion preference is respected.
- [ ] Cover placeholders do not cause layout shift or broken-image UI.
- [ ] Mobile safe areas, 44×44 px targets and long titles are verified.

## Authentication and authorization

- [ ] Development and production projects and OAuth clients are separate.
- [ ] Redirect URLs allow only approved origins.
- [ ] RLS is enabled on every user-data table.
- [ ] Automated cross-user denial tests pass for select/insert/update/delete.
- [ ] Service-role credentials are server-only and never bundled to the client.
- [ ] Session expiry, sign-out and revoked-provider access are recoverable.
- [ ] Account deletion requires recent authentication when appropriate.

## Database and migrations

- [ ] Schema can migrate from an empty database without manual steps.
- [ ] Generated TypeScript types match the deployed schema.
- [ ] Constraints and indexes cover documented invariants and query paths.
- [ ] Reading-run transitions and completion are idempotent.
- [ ] Timezone, DST, leap day and year-boundary tests pass.
- [ ] Backup exists and restoration was rehearsed in a non-production target.
- [ ] Roll-forward or recovery procedure is documented for the release.

## Files, covers and external providers

- [ ] Custom-cover bucket is private.
- [ ] MIME type, byte size and image dimensions are validated server-side.
- [ ] Object paths are user-scoped and cannot escape their prefix.
- [ ] Replaced and deleted cover objects are cleaned up safely.
- [ ] External image domains are allow-listed or proxied safely.
- [ ] Google Books quota/error states are handled.
- [ ] Open Library fallback respects its usage guidance.
- [ ] Provider outage does not block manual entry or existing library use.

## Privacy, legal and support

- [ ] Privacy policy accurately lists collected data, providers and retention.
- [ ] Terms, support contact and deletion instructions are published.
- [ ] Analytics and error monitoring exclude notes, titles and private cover URLs.
- [ ] Cookie/consent behavior matches actual jurisdiction and data use.
- [ ] Data export accurately states whether custom-cover bytes are included.
- [ ] User-facing incident and support process is documented.

## Reliability and performance

- [ ] Unit, integration and end-to-end suites pass from a clean install.
- [ ] Production build, lint and type-check pass without ignored failures.
- [ ] Home, Library and Calendar meet agreed mobile performance budgets.
- [ ] Images are sized and lazy-loaded appropriately.
- [ ] Loading, empty, error, retry and offline states are tested.
- [ ] Rate limiting and abuse controls protect expensive endpoints.
- [ ] Error monitoring and uptime checks work without leaking private content.

## PWA and browser coverage

- [ ] Manifest uses final name, short name, icons and theme colors.
- [ ] Install works on supported Android and iOS versions.
- [ ] Offline fallback never claims unsaved reading activity was stored.
- [ ] Current Safari, Chrome and Edge complete critical flows.
- [ ] OAuth works in installed and browser modes.

## Release operations

- [ ] Environment variables are documented and present in the correct target.
- [ ] Production secrets were not copied from development.
- [ ] Changelog and version are updated.
- [ ] Release commit and tag point to the verified build.
- [ ] Database migrations run before code that requires them.
- [ ] Smoke test passes after deployment.
- [ ] Rollback/recovery owner is known.
- [ ] Product owner explicitly approved public release.
