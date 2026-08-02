# Savr

**The Consumer Savings Operating System** — before you spend, Savr it.

Monorepo for Phase 1 (Nairobi): groceries basket compare (wedge), ride quotes, fuel nearby, wallet, merchant portal, city map, invite gate.

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/VISION.md](docs/VISION.md) | Mission, positioning, 10-year ambition |
| [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) | 12 platforms — Spending OS / Google of Spending |
| [docs/WEDGE.md](docs/WEDGE.md) | Why groceries wins Phase 1 |
| [docs/MVP_PRD.md](docs/MVP_PRD.md) | MVP requirements |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Postgres / Supabase model |

## Structure

```
apps/web      Next.js (React) — primary MVP UI
apps/mobile  Flutter thin shell (Supabase-ready)
supabase/    Migrations + config
docs/        Product spine
```

## Live stack

| Service | Status |
|---------|--------|
| GitHub | https://github.com/essendisidney/savr |
| Supabase | Project `savr` (`thmxbhpuomggphgdzllk`) — schema + Nairobi seed applied |
| Vercel | https://savr-teal.vercel.app (Root Directory: `apps/web`) |

## Quick start (web)

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For local work without the invite wall, set `INVITE_GATE_ENABLED=false`.

### Env vars (`apps/web/.env.local`)

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Phone OTP mint + admin writes |
| `TAIFA_API_KEY` | Server only | Taifa Mobile SMS send |
| `TAIFA_SENDER_ID` | Server only | SMS sender (e.g. `SIDNET`) |
| `SMS_BYPASS` | Server only | `true` logs OTP locally (dev only) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Client | Footer / beta banner support mailto |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Client | Optional WhatsApp link (E.164 or wa.me) |
| `INVITE_GATE_ENABLED` | Server | `false` disables middleware invite wall |
| `INVITE_COOKIE_SECRET` | Server | Signs `savr_invite` cookie |
| `MPESA_DRY_RUN` | Server | Default `true` — no money moved |
| `MPESA_*` | Server | Daraja B2C keys when leaving dry-run |

Mirror the same keys on Vercel (Production + Development). Never expose the service role key to the browser.

Seed invite codes: `NAIROBI`, `SAVRBETA`, `WESTLANDS`.

### M-Pesa redeem (sandbox / dry-run)

1. Keep `MPESA_DRY_RUN=true` until Daraja keys are pasted.
2. Users request redeem → `redeem_requests` stay `pending`.
3. Ops: `POST /api/mpesa/disburse` with `Authorization: Bearer $MPESA_DISBURSE_SECRET` (or service role).
4. Dry-run marks requests `paid` with ledger note “no M-Pesa money moved”. Live mode waits for `/api/mpesa/b2c/result`.

### Soft-launch checklist

- [ ] SMS OTP live on Vercel
- [ ] `INVITE_GATE_ENABLED` + `INVITE_COOKIE_SECRET` set
- [ ] Support email / WhatsApp
- [ ] Seed refresh cadence for grocery + fuel
- [ ] M-Pesa: dry-run OK for beta; paste keys + set `MPESA_DRY_RUN=false` for real B2C
- [ ] Terms / Privacy linked

## Supabase

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli).
2. From repo root: `supabase start` then `supabase db reset` (applies migrations + Nairobi seed).
3. Copy API URL + anon key into `apps/web/.env.local`.

## Flutter

```bash
# SDK (once): clone stable Flutter, add bin to PATH
# git clone https://github.com/flutter/flutter.git -b stable --depth 1

cd apps/mobile
flutter create . --project-name savr_mobile --org app.savr
flutter pub get
flutter run --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

`lib/main.dart` is a thin live shell (Home, Basket, Fuel, Wallet). Map/rides deep-link to the web app. Platform folders are generated locally (gitignored until you choose to commit them). No store submission in this pass.

## Phase 1 scope

- **P0:** Basket compare, price compare, cashback ledger, merchant portal (+ CSV), invite gate  
- **P1:** Ride estimates (server surge heuristics), fuel nearby, city map (Leaflet), M-Pesa B2C dry-run  
- **City:** Nairobi · **Goal:** 10,000 users · habit = weekly shop prep
