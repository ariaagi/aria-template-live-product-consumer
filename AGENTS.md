<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## ARIA Consumer Template Guardrails

- **Not** the SaaS template (`aria-template-live-product`). This repo is B2C consumer web only.
- Free-core: Home + Settings shell only; session auth, no paid app-access gates.
- Do not add marketing landing pages. Focus on authenticated product surfaces under `/home`.
- Keep auth centralized (Google + email via Better Auth / Neon).
- Extend domain logic under `src/features/*`; do not rewrite `src/components/ui/*`.
- Extend navigation via `src/config/sidebar-nav.config.ts`, `home-nav.config.ts`, `settings-tabs.config.ts` — not by editing `app-shell.tsx` or `home-shell.tsx`.
- Public share routes live under `/share/*` (no session required); middleware does not gate them.
- Run `npm run lint` and `npm run build` after substantial changes.
