# AGENTS.md — Shelf Seasons

This file governs AI-assisted work in this repository.

## Read before changing code

Read these files in order:

1. `PRODUCT_SPEC.md`
2. `docs/DECISIONS.md`
3. the domain document relevant to the task
4. `docs/ROADMAP.md`
5. `README.md`

If instructions conflict, follow the source-of-truth order in `docs/DECISIONS.md`. Ask before making a product decision that is not covered.

## Work scope

- Implement only the requested roadmap stage or bounded task.
- Do not silently add social, AI, gamification, subscriptions or native apps.
- Do not deploy, buy domains, create paid resources, rotate secrets or mutate production unless explicitly requested.
- Preserve unrelated user changes in a dirty worktree.
- Before editing, inspect the current branch, status, relevant files and existing tests.
- Prefer small reversible changes over broad rewrites.

## Brand and localization invariants

- Brand is always `Shelf Seasons`; technical slug is always `shelf-seasons`.
- Never introduce `vmeste`, `Together`, a translated brand or a locale-specific repository name.
- Every user-facing feature ships with complete `en` and `ru` copy in the same change.
- Do not hard-code user-facing strings in components.
- Russian product copy must be gender-neutral.
- Use locale-aware dates, numbers and ICU plurals.
- Group reading days in `profiles.timezone`, never server timezone.

## Domain invariants

- A book in a user's library is a user-owned snapshot, not a shared mutable catalog row.
- Every reread creates a new `reading_run`.
- Reading activity exists only when the user creates a `reading_session`.
- Opening the app or editing status never changes a streak.
- If yesterday qualifies and today does not yet, the current streak remains active until today ends.
- Duplicate sessions, completion actions and retries must be idempotent.
- Goal and recap calculations come from authoritative runs and sessions, not cached display fields.

## Security and privacy

- Enable and test RLS on every user-data table before exposing a feature.
- Never trust a client-supplied `user_id`; derive ownership from the authenticated session.
- Never expose service-role keys to the browser.
- Keep user-uploaded covers private and validate bytes, type, size and dimensions server-side.
- Do not log private notes, book titles, raw provider payloads, tokens or signed URLs.
- Add no secret to code, fixtures, screenshots or documentation. Use `.env.example` placeholders.
- Validate OAuth return paths against approved origins.

## Database work

- Use ordered forward migrations; do not make undocumented dashboard-only schema edits.
- Change schema, RLS policies, generated types and relevant tests together.
- Test migrations from an empty database.
- Add constraints for invariants and indexes for documented access paths.
- Destructive production migrations require an explicit backup and recovery plan.

## UX and accessibility

- Optimize the daily check-in for a few seconds and one-handed mobile use.
- Rich details remain optional; do not turn reading into administrative work.
- Every async mutation needs pending, success, error and retry behavior.
- Preserve safe user input after recoverable errors.
- Provide keyboard access, visible focus, semantic labels, 44×44 px touch targets and reduced motion.
- Never communicate state by color or cover image alone.
- Verify empty, loading, offline, error and long-content states in both themes and locales.

## Engineering standards

- Use strict TypeScript; avoid `any`, blanket casts and ignored errors.
- Keep server-only code outside client bundles.
- Prefer small domain modules and explicit data boundaries over large page components.
- Pin deliberate dependency versions and commit the lockfile.
- Do not upgrade unrelated dependencies during a feature task.
- Keep provider integrations behind adapters so manual entry and fallback remain available.
- Add tests at the lowest useful layer plus one end-to-end path for critical journeys.

## Required verification

Before declaring a task complete, run the repository's actual equivalents of:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Run targeted integration/end-to-end tests when the task touches a critical journey. Do not claim a check passed unless it ran successfully. If a command cannot run, report the exact blocker and what remains unverified.

For visual changes, inspect at 320, 768 and 1440 px in English and Russian, plus light and dark themes. Capture evidence when the workspace supports it.

## Documentation and handoff

- Update product/domain docs when behavior changes.
- Add a concise changelog entry for user-visible changes.
- Explain the outcome, important decisions, files changed and verification performed.
- Call out migrations, environment variables, manual setup and unresolved risks.
- Do not overwrite a mature README with generated boilerplate.

## Git discipline

- Use non-interactive commands.
- Do not reset, discard or overwrite unrelated user work.
- Do not force-push.
- Keep commits focused when the user requests commits.
- Never commit secrets or local environment files.

## Windows handoff

The primary local target is Windows PowerShell under `P:\Projects\shelf-seasons`. When giving user commands, provide PowerShell-safe commands and avoid assuming Unix-only tooling unless an equivalent is included.
