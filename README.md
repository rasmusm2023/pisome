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

## Product scope

- **MVP:** Buy/sell portal for Madrid, Barcelona, Málaga, Valencia
- **Design:** HomeQ-inspired calm blue UI, photo-first listings
- **Monetization:** Essential / Plus / Premium listing packages
- **Phase 3 ready:** `Listing.purpose` includes `RENT` + nullable rental fields (`rentDeposit`, `contractType`, `attrs`)
