# CashSplit Full (Vue 3 + Tailwind + Vercel Functions + Postgres + Clerk + PWA)

## Quickstart
```bash
pnpm i
cp .env.local.example .env.local
pnpm dev
```
Set `.env.local`:
```ini
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
# POSTGRES_URL will be provided by Vercel when Postgres is attached
```

- API: `/api/groups`, `/api/expenses`, `/api/fx`
- DB init: `pnpm db:init` (with valid Postgres env)
- PWA ready (manifest + service worker)