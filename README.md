# Savr

**The Consumer Savings Operating System** — before you spend, Savr it.

Monorepo for Phase 1 (Nairobi): groceries basket compare (wedge), ride quotes, fuel nearby, wallet, merchant portal shell.

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/VISION.md](docs/VISION.md) | Mission, positioning, phases |
| [docs/WEDGE.md](docs/WEDGE.md) | Why groceries wins Phase 1 |
| [docs/MVP_PRD.md](docs/MVP_PRD.md) | MVP requirements |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Postgres / Supabase model |

## Structure

```
apps/web      Next.js (React) — primary MVP UI with live compare demos
apps/mobile  Flutter shell — install Flutter, then `flutter create .` to generate platforms
supabase/    Migrations + config
docs/        Product spine
```

## Quick start (web)

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Basket / rides / fuel use local seed logic so the product is demoable before Supabase is linked.

## Supabase

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli).
2. From repo root: `supabase start` then `supabase db reset` (applies migrations + Nairobi seed).
3. Copy API URL + anon key into `apps/web/.env.local`.

Schema includes profiles, merchants, products, prices, shopping lists, basket compares, rides, fuel, promotions, cashback rules, wallet + ledger, and RLS.

## Flutter

Flutter SDK is not assumed on this machine. After installing Flutter:

```bash
cd apps/mobile
flutter create . --project-name savr_mobile
flutter pub get
flutter run
```

`lib/main.dart` already contains the Phase 1 navigation shell (Home, Basket, Rides, Fuel, Wallet).

## Phase 1 scope

- **P0:** Basket compare, price compare, cashback ledger, thin merchant portal  
- **P1:** Ride compare (deep-link/demo quotes), fuel nearby  
- **City:** Nairobi · **Goal:** 10,000 users · habit = weekly shop prep
