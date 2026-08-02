# Pisome

Spanish property marketplace — Nordic clarity for buy/sell (rentals later).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- next-intl (`es` / `en`)
- Prisma + SQLite (swap `DATABASE_URL` to Postgres for production)
- Auth.js credentials
- MapLibre + OpenStreetMap
- Stripe packages (demo mode when keys unset)

## Quick start

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/es`).

### Demo accounts

| Email | Password | Role |
|---|---|---|
| `seeker@pisome.es` | `pisome123` | Home seeker |
| `agent@pisome.es` | `pisome123` | Agent |

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production
- `npm run db:seed` — seed launch-city inventory
- `npm run db:push` — sync Prisma schema

## Deploy (Netlify)

`/search` and other data pages need the SQLite database at runtime. Local `prisma/dev.db` is gitignored, so Netlify builds a fresh `prisma/deploy.db` during deploy (`netlify.toml`).

In Netlify → Site configuration → Environment variables, set at least:

| Variable | Example |
|---|---|
| `AUTH_SECRET` | long random string |
| `AUTH_URL` | `https://your-site.netlify.app` |
| `NEXT_PUBLIC_APP_URL` | `https://your-site.netlify.app` |

`DATABASE_URL` is already set in `netlify.toml` to `file:./deploy.db` (Prisma resolves that relative to `prisma/`, producing `prisma/deploy.db`). For real production traffic, swap to hosted Postgres (Neon, Supabase, etc.) as noted above — SQLite on serverless is fine for demos, not durable writes.

- **MVP:** Buy/sell portal for Madrid, Barcelona, Málaga, Valencia
- **Design:** HomeQ-inspired calm blue UI, photo-first listings
- **Monetization:** Essential / Plus / Premium listing packages
- **Phase 3 ready:** `Listing.purpose` includes `RENT` + nullable rental fields (`rentDeposit`, `contractType`, `attrs`)
