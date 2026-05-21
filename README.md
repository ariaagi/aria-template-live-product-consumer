# ARIA Live Product Template (Consumer Web)

Production template for ARIA-generated **consumer web** MVP apps (B2C, free-core).

Forked from `aria-template-live-product` (B2B SaaS), trimmed for B2C consumer web.

## What This Template Includes

- Better Auth + Neon Postgres
- App shell: **Home** and **Settings** only
- Extension points: `sidebar-nav.config.ts`, `home-nav.config.ts`, `settings-tabs.config.ts`
- Server helpers: session auth, BYOK secrets, email, structured API responses
- Baseline SQL migrations `0001`–`0004` (auth, secrets, events, rate limits)

## Routes

- Auth: `/auth/sign-in`, `/auth/sign-up`, `/login`
- App: `/home`, `/settings`
- Public share (codegen): `/share/*` — no auth gate in middleware
- API: `/api/auth/*`, `/api/settings/profile`

## Local Development

```bash
npm install
npm run dev
```

## Build Config

`aria-build.config.json` — default `monetizationMode: has_free_tier`, free pricing.

## Quality Checks

```bash
npm run lint
npm run build
```
