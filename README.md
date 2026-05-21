# ARIA Live Product Template (Consumer Web)

Production template for ARIA-generated **consumer web** MVP apps (B2C, free-core; not B2B SaaS billing-first).

Forked from `aria-template-live-product`. ARIA selects this repo when `discover_lane === consumer_web`.

## What This Template Includes

- Better Auth + Neon Postgres baseline auth wiring.
- App shell with `Home`, `Billing`, and `Settings` (billing shell may be hidden in a future consumer-specific revision).
- Centralized build configuration contract for branding and app metadata.
- Extension points: `sidebar-nav.config.ts`, `home-nav.config.ts`, `settings-tabs.config.ts`.
- Ready-to-extend structure for agent-generated product features.

## Routes

- Auth: `/auth/sign-in`, `/auth/sign-up`, `/login`
- App: `/home`, `/billing`, `/settings`
- API: `/api/auth/*`, `/api/settings/profile`, `/api/billing/*` (when billing is in scope)

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The repo includes a default **`aria-build.config.json`** at the root so `npm run dev` matches production behavior without setting env.

## Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required for normal auth + DB behavior:

- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_SECRET`
- `DATABASE_URL` (or `NEON_DATABASE_URL`)

Optional / feature-specific:

- `BETTER_AUTH_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `NEXT_PUBLIC_ARIA_API_BASE_URL`
- `ARIA_BUILD_CONFIG_JSON` (primary runtime source set by ARIA on Vercel)
- `STRIPE_*` (marketplace payouts only for consumer; not app-access subscriptions)
- `E2E_BYPASS_AUTH` (test-only)

## Build Config Contract

**Product copy and branding** live in **`aria-build.config.json`** at the repository root. ARIA commits that file before the first Vercel deploy.

Resolution order in **`getBuildConfig()`**:

1. **`ARIA_BUILD_CONFIG_JSON`** (when set by ARIA at deploy time)
2. **`aria-build.config.json`** on disk (repo root)
3. Built-in defaults

## Quality Checks

```bash
npm run lint
npm run build
npm run test:e2e
```
