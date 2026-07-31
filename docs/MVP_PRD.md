# Savr MVP Product Requirements (Phase 1)

**City:** Nairobi  
**Wedge:** Groceries basket compare ([WEDGE.md](./WEDGE.md))  
**Retention hooks:** Ride comparison, fuel nearby prices  
**Goal:** 10,000 users; prove weekly “check Savr before shop” habit

---

## Personas

| Persona | Need |
|---------|------|
| Household shopper | Cheapest full list + any cashback before leaving home |
| Commuter | Quick ride / fuel check without opening 3 apps |
| Merchant (supermarket / duka) | Reach intent buyers with promos and catalog |

---

## Must-have features

### 1. Auth & profiles
- Email / phone OTP via Supabase Auth
- Profile: name, city, preferred merchants
- Roles: `consumer`, `merchant_admin`

### 2. Basket compare (P0 — wedge)
- Create / edit shopping list (name + line items)
- Match items to catalog products (search + manual link)
- Compare totals across merchants with price coverage
- Show: total, estimated savings vs most expensive / vs median, cashback offer, distance if geo available
- Recommendation: best **total value** (price − cashback + optional delivery)

### 3. Single-product price compare (P0)
- Search catalog → see merchant prices
- Deep-link or “directions” to store when no checkout API

### 4. Ride comparison (P1)
- Enter pickup / destination
- Show partner quotes (API or estimated + deep-link to Bolt / Uber / Little)
- Surface cashback if configured
- Label clearly when quote is estimated vs live

### 5. Fuel nearby (P1)
- Map / list of stations with price per litre
- Sort by price, distance, total value with cashback
- Crowdsource / partner feed ingestion path

### 6. Savings cashback & wallet (P0 ledger, P1 redeem)
- Ledger: earn on completed “smart” actions (compare → choose recommended / cheaper path)
- Wallet balances: cashback, coupons, merchant credits
- Redeem: mark as pending until payment partners live (M-Pesa later)

### 7. Merchant portal (P0 thin)
- Register merchant + locations
- Upload / edit products and prices
- Create promotions and cashback rules
- Basic analytics: impressions, list inclusions (privacy-safe aggregates)

### 8. Shopping history & lifetime savings
- Past lists and compares
- Running “Saved with Savr” total

---

## Explicitly out of MVP

Voice AI, receipt OCR, barcode, wishlist alerts, family mode (schema-ready only), business procurement, travel, insurance, AI chat agent, sponsored ranking (policy stub only).

---

## User journeys (acceptance)

### A. Morning shop prep
1. User opens Savr → Shopping Lists  
2. Adds Milk, Bread, Rice, Sugar, Soap, Oil  
3. Taps Compare  
4. Sees Naivas / Quickmart / Carrefour totals  
5. Recommendation: Carrefour, save KES X, earn KES Y cashback  
6. User confirms choice → cashback pending / earned per rules  

### B. Ride
1. Destination: Airport  
2. Sees partner prices + recommendation  
3. Opens partner app via deep-link  

### C. Fuel
1. Nearby stations with KES/L  
2. Recommendation with cashback  

### D. Merchant
1. Admin signs up → creates merchant  
2. Adds SKUs and prices  
3. Creates 5% cashback promo on dairy  

---

## Non-functional

- Mobile-first web usable on phone; Flutter app shell parity for core screens
- RLS on all user/merchant data
- Currency: KES; locale: en-KE
- Sponsored results (future) must be labeled — no silent reordering in MVP

## Success metrics

See [WEDGE.md](./WEDGE.md). Plus:

- Activation: first basket compare within 24h of signup ≥ 50%
- D7 retention ≥ 25%
- Merchant-uploaded price freshness &lt; 7 days for top 500 SKUs

## Tech constraints

- Frontend: Flutter (iOS/Android), React (Web)
- Backend: Supabase (Auth, Postgres, Realtime, Edge Functions, Storage)
- Payments later: M-Pesa, Airtel Money, cards
- Maps: Google Maps / OSM
- Search: Postgres full-text first; Meilisearch when catalog scale demands it
