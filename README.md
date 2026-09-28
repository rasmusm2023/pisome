# Pisome

Spanish property marketplace — Nordic clarity for buy/sell (rentals later).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- next-intl (`es` / `en`)
- Prisma + **Supabase Postgres** (free tier)
- **Supabase Auth** (email/password)
- MapLibre + OpenStreetMap
- Stripe packages (demo mode when keys unset)

## Supabase setup (free)

Create a project at [supabase.com](https://supabase.com) (Free plan). Then:

1. **Authentication → Providers → Email:** turn **Confirm email** off for local/demo (free-tier mail is limited).
2. **Project Settings → API:** copy Project URL, `anon` key, and `service_role` key.
3. **Project Settings → Database:** copy the **Transaction pooler** URI (port `6543`) and the **direct** URI (port `5432`).
4. Put them in `.env` (see `.env.example`).
   - `DATABASE_URL` = pooler, username `postgres.PROJECT_REF`, add `?pgbouncer=true`
   - `DIRECT_URL` = direct connection for `prisma migrate`
   - Never put `service_role` in client code.
5. Agent join at `/agent/join` is public, reached from the sign-up chooser. New agent accounts can browse the workspace; publishing, inbox, and stats stay locked until a listing plan is selected (Stripe, or demo mode if keys are unset). Private-person signup creates a seeker.

Free-tier notes: projects pause after about a week of inactivity; unpause in the dashboard. Stay on the pooler so you do not need the paid IPv4 add-on.

```bash
cp .env.example .env
# fill the Supabase values
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/es`).

Seed once. Do **not** re-seed on every deploy — Postgres is durable.

### Demo accounts

| Email | Password | Role |
|---|---|---|
| `seeker@pisome.es` | `pisome123` | Home seeker |
| `agent@pisome.es` | `pisome123` | Agent |

Buyers land on `/account`. Agents land on `/agent`. Sign up at `/auth/signup` asks whether you are a private person or an agent, then continues to `/auth/signup/private` or `/agent/join`. Agent workspace stays paywalled until a plan is selected.

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production
- `npm run db:migrate` — apply Prisma migrations (`prisma migrate deploy`)
- `npm run db:seed` — seed launch-city inventory + demo Auth users (one-time)
- `npm run db:studio` — Prisma Studio

## Deploy (Netlify)

Set these in Netlify → Site configuration → Environment variables:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-site.netlify.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; needed if you seed from CI |
| `DATABASE_URL` | Transaction pooler URI + `?pgbouncer=true` |
| `DIRECT_URL` | Session pooler URI for migrations (port `5432`). Optional on Netlify: if unset, the migrate script derives it from `DATABASE_URL`. |

`netlify.toml` runs `prisma migrate deploy` then the Next build. It does **not** seed.

- **MVP:** Buy/sell portal for Madrid, Barcelona, Málaga, Valencia
- **Design:** HomeQ-inspired calm blue UI, photo-first listings
- **Monetization:** Essential / Plus / Premium listing packages (Stripe demo until keys are set)
- **Phase 3 ready:** `Listing.purpose` includes `RENT` + nullable rental fields (`rentDeposit`, `contractType`, `attrs`)
