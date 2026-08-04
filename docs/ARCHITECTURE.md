# Savr Architecture

**The company is the city. The app is one building.**

Modules evolve independently. Screens are temporary. **Entities and engines** are durable.

Vision and economy stay fixed. This doc is the technical city plan — without shipping AI Brain, payments rails, or digital twins before the grocery graph earns trust.

Related: [CONSTITUTION.md](./CONSTITUTION.md) · [VISION.md](./VISION.md) · [ECOSYSTEM.md](./ECOSYSTEM.md) · [WEDGE.md](./WEDGE.md) · [DATA_MODEL.md](./DATA_MODEL.md) · [MVP_PRD.md](./MVP_PRD.md)

---

## Wall rules (ship filter)

From the [Constitution](./CONSTITUTION.md): Savr exists to make every purchase smarter. A feature ships only if it improves at least one of:

1. **User value** — spend less or get better value (explainable KES delta)
2. **Fair merchant reach** — merchants reach intent buyers without buying opaque ads
3. **Decision graph** — better prices, coverage, freshness, or ranking signal

**North star:** Money Saved for Users.  
**Neutrality:** Partners plug into Savr; Savr does not become supermarket, taxi, bank, or courier.

---

## The city (target modules)

```
                         SAVR
                 ┌──────────────────┐
                 │    AI Brain      │  ← last to thicken
                 └────────┬─────────┘
      ┌───────────────────┼───────────────────┐
      │                   │                   │
 Products            Merchants            Consumers
      │                   │                   │
 Wallet ──────────── Rewards ──────────── Payments*
      │                   │                   │
 Search ──────────── Pricing ─────────── Analytics
```

\*Payments = partner rails + wallet orchestration, not “become M-Pesa.”

| Module | Job | Status |
|--------|-----|--------|
| Products | Canonical catalog + matching | Live (seed + merchant) |
| Merchants | Profiles, locations, trust | Live thin |
| Consumers | Identity + preferences | Live (basic profile) |
| Wallet | Cashback / credits ledger | Thin (dry-run redeem) |
| Rewards | Cashback rules → one earn path | Live simple |
| Payments | Payout / checkout partners | Dry-run only |
| Search | Commerce search | Live basic |
| Pricing | Current + history + confidence | Current only; history later |
| Analytics | Events → Money Saved / demand | Partial (compares stored) |
| AI Brain | Reason across marketplace | **Not yet** — after data density |

Every module can deepen without rewriting the others — if we keep **entities** shared in Postgres and engines as clear boundaries.

---

## Core principle: entities, not screens

Everything connects to these:

| Entity | Meaning | Today |
|--------|---------|--------|
| Consumer | Person / household making decisions | `profiles` |
| Merchant | Business competing on value | `merchants` + locations |
| Product | Canonical SKU (one truth, many listings) | `products` |
| Service | Comparable non-SKU offer (ride, hotel, cover) | Thin (rides/fuel) |
| Price | Observation at merchant/location + time | `merchant_prices` |
| Promotion | Time-bound value change | `promotions` |
| Reward | Cashback / coupon / credit rule or grant | `cashback_rules` + ledger |
| Receipt | Proof of spend → teach + correct prices | `/check` teach only; OCR later |
| Location | Branch / geo for distance & availability | `merchant_locations` |
| Order | Chosen decision / fulfillment intent | Partial (`basket_compares`) |
| Review | Quality signal | Not yet |

Screens (Home, Basket, Portal) are **views over entities**. New features add fields, observations, or engines — not parallel databases.

---

## Graphs

### Product graph (critical moat)

One product → many merchant listings.

```
Coca-Cola 500ml (canonical)
  ├─ Naivas      KES 65
  ├─ Quickmart   KES 70
  ├─ Carrefour   KES 60
  └─ Glovo       KES 75   ← same product_id, different channel
```

Hard problem: matching (barcode, brand+size, merchant SKU aliases). Wedge path: curated staples + merchant upload to known `product_id`. Matching engine thickens later — do not fake identity across ambiguous names.

### Service graph (same compare idea)

Taxi CBD→Airport, hotel nights, insurance covers — comparable options with total cost. Same ranking contract as products; different entity subtype.

---

## Digital twins (consent-first)

### Consumer twin

Not just a login — a preference + spend model **only with consent**.

Example fields (evolve): preferred merchants, category spend bands, transport preference, brand affinities, alert thresholds.

**Now:** name, city, preferred merchants, lists, compare history.  
**Later:** household coach, predictive fills — gated by privacy settings and [Constitution](./CONSTITUTION.md) data ethics.

### Merchant twin

Branch-level truth: SKU count, offers, avg basket on Savr, stock freshness, delivery flag, cashback rate, **trust score**.

**Now:** catalog, promos, pricing gaps, verification flag.  
**Later:** live stock, delivery SLA, returns, support metrics.

---

## Engines (what Amazon/Google-style companies protect)

| Engine | Does | Stage |
|--------|------|--------|
| **Search** | Commerce query → brand → model → merchants → offers → rewards → best value | Basic catalog search live |
| **Price** | Current, history, average, lowest, **confidence** (freshness × source) | Current + `observed_at`; history next |
| **Ranking** | Score options (price, distance, delivery, quality, reviews, cashback, warranty) | Stage A: net KES (see below) |
| **Recommendation** | Top 3 + plain-language why | Top ranks + savings copy live |
| **Event** | search → view → save → drop → notify → purchase → cashback | Compares/lists today; full stream later |
| **Notification** | Only high-value alerts (wishlist drop, fuel rise, better basket) | After watchlist/history |
| **Trust** | Merchant dependability beyond sticker price | `is_verified` now; score later |
| **AI Brain** | “I have KES 20,000” → best phone + where + why + warranty + CB + budget left | After density |
| **Marketplace Intelligence** | Category growth, price inflation, promo lift (internal; external = aggregate only) | After event volume |

### Ranking stages (evolve, don’t replace)

**A — now:** `effective = shelf − promo − cashback` (+ distance / coverage). Always explain in KES.

**B — total cost:** + delivery + assembly + warranty − loyalty (real partner numbers only).

**C — multi-factor:** user-tunable weights (e.g. “fastest” vs “cheapest”); never hide KES math; sponsored cannot beat worse net value.

**D — AI / autopilot:** confidence-labeled; approve-once; not merchant of record by stealth.

Illustrative Stage C weights (tune with research):

| Factor | ~Weight |
|--------|---------|
| Price / total cost | 35% |
| Distance | 15% |
| Quality | 15% |
| Delivery | 10% |
| Reviews | 10% |
| Cashback | 10% |
| Warranty | 5% |

---

## System today (executable)

```
Clients: apps/web (Next.js) · apps/mobile (Flutter shell)
    → App routes: compare, basket, prices, wallet, merchant, rides, fuel
    → Supabase (RLS): entities in Postgres
Intelligence now: lib/compare + catalog loaders (not a separate AI service)
```

| Actor | Writes | Trust |
|-------|--------|--------|
| Merchant admin | prices, promos, rules | Highest if verified |
| Ops / seed | catalog waves | Bootstrap |
| Consumer | lists, compares, share | Intent |
| Receipt / crowdsource | future observations | Moderated |

Amounts = **integer cents**. Wallet credit = security-definer only.

---

## Data flow (spine)

```
Merchant / seed → Price (+ Promotion)
        → Search / list
        → Ranking → Recommendation (Top N + why)
        → Event (compare / choose)
        → Reward / Wallet
        → (later) Notification · Intelligence · AI Brain
```

Partner plugs (brands, banks, Protect, logistics) attach to Intent + Ranking — see introduce-later map.

---

## Five competitive moats

1. **Data** — verified prices, offers, receipts  
2. **AI** — better decisions from denser consented data  
3. **Network** — consumers ↔ merchants flywheel  
4. **Trust** — explainable recommendations people believe  
5. **Ecosystem** — banks, retailers, delivery, insurers integrate *with* Savr  

Moats compound only if we stay a **decision company**, not a transaction grab.

**Final evolution:** built around decisions (“feed my family”, “furnish my house”), not around checkout alone.

---

## Introduce later (do not build early)

| Idea | Prerequisite |
|------|----------------|
| Full consumer / merchant twins | Consent UX + enough history |
| Product matching engine | Ambiguous multi-merchant SKUs at scale |
| Price history + confidence | Append-only observations |
| Smart notifications | Watchlist + proven value (don’t train mute) |
| Trust score | Delivery / returns / accuracy signals |
| Event stream productized | Analytics pipeline + privacy |
| AI Brain | Millions of prices/searches; Constitution ethics |
| Unified multi-asset wallet UX | Real reward sources beyond cashback |
| Payments orchestration | Partner rails; dry-run until explicit go |
| External marketplace intelligence | Anonymization product |

---

## Scale path

Nairobi groceries → denser SKUs → adjacent categories → Kenya cities → EA one market at a time.

| Users | Focus |
|-------|--------|
| 0–10k | Density, savings honesty, merchant twin basics |
| 10k–100k | Price engine history, alerts, receipts, events |
| 100k–1M | API / Finance / Protect pilots |
| 1M+ | AI Brain, Intelligence product, multi-country |

---

## Security & privacy

- RLS everywhere user/merchant data lives  
- Intelligence externally = aggregated only  
- Twin personalization = opt-in  
- Partner offers = contextual opt-in  
- M-Pesa live = last, explicit  

---

## Build order (spine)

1. **Density** — catalog + fresh merchant prices  
2. **Honesty loop** — history → alerts → receipts  
3. **Events** — durable intent stream for later API/AI  
4. **Total-cost fields** — ready for logistics/warranty plugs  
5. **Money Saved** — instrument shown → then verified savings  
6. **Twins / Trust / AI** — only after 1–5 earn the right  

Constitution governs *why*. This file governs *how the city is zoned*.
