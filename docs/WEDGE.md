# Savr Wedge Decision

**Decision: Kenya C2C second-hand marketplace with escrow is the Phase 1 habit-former.**

Brand line: **Sell. Buy. Trust.**

Grocery compare, rides, and fuel are **out of wedge** — retired product surface, not retention hooks.

---

## Criteria

| Criterion | Why it matters |
|-----------|----------------|
| Weekly frequency | Habit formation needs repeated opens |
| Clear trust delta | User must feel “Savr made this deal safer” |
| Supply-side path | Anyone can list in ~60 seconds |
| Viral / share moment | “Sold / bought safely on Savr” screenshot |
| Monetization path | 3% fee on escrow release; later boosts / verify |

---

## Scorecard (1–5)

| Option | Frequency | Trust clarity | Supply | Share | Monetize | **Total** |
|--------|-----------|---------------|--------|-------|----------|-----------|
| **Second-hand + escrow** | 4 | 5 | 5 | 5 | 5 | **24** |
| Grocery basket compare | 5 | 3 | 2 | 4 | 3 | **17** |
| Ride / fuel utility | 4 | 2 | 1 | 2 | 2 | **11** |

---

## Why marketplace + escrow wins

1. **Pain is trust, not price tables.** Urban Kenyans already buy/sell used goods; fraud and no-shows are the blocker.
2. **Escrow is the OS moment.** Pay → hold → confirm → release is a product, not a feature bolted onto search.
3. **Supply is democratized.** Phone + photo + title + price — no merchant portal required for Day 1.
4. **Fee aligns with completion.** 3% on release rewards closed deals, not vanity listings.
5. **Share moment is the dry-run (then live) deal screenshot.** WhatsApp proof of a completed trusted sale.

## Why groceries / rides / fuel are not the wedge

- Compare OS competed with shelves and partner apps without owning the money moment.
- Ride/fuel quotes felt thin without partner APIs.
- Constitution previously said “not a marketplace / M-Pesa off” — **this wedge replaces that spine.**

---

## Phase 1 north star

> **Nairobi professional opens Savr, posts something in 60 seconds or finds a deal, pays with M-Pesa into escrow, confirms, seller is paid minus 3%, both rate.**

### Success metrics (first 90 days)

| Metric | Target |
|--------|--------|
| Live listings from real sellers | Growing week over week |
| Deals reaching `in_escrow` (dry-run or live) | ≥ 30% of “Buy” starts |
| Deals released after confirm | ≥ 50% of escrow deals |
| Mutual ratings after release | ≥ 40% of released deals |
| Time to first listing (signed-in) | ≤ 60 seconds median |

### Explicit non-goals for wedge period

- AI pricing / chat shopping agent
- Deep categories, bidding, subscriptions
- Delivery network as Day-1 product
- Jumia/Jiji scrapers as inventory
- Grocery tips, fuel, rides as product tabs

---

## Sequencing

1. Strip old compare OS chrome; ship Home / Sell / Search / Listing / Deal / Profile.  
2. Schema + RLS + listing photos; demo listings so Home is never empty.  
3. STK pay-in + escrow ledger + B2C release (**dry-run default**).  
4. Seed + WhatsApp walkthrough; **live M-Pesa only after explicit go.**  
5. Week-2: cancel unpaid deals, WhatsApp trusted-sale share, seller phone gate, boost (KES 50) + verify (KES 100) stubs.  
6. Wave-3: dispute → refund, 60m unpaid expire cron, already-rated + listing WA share, login defaults to Home.  
7. Wave-4: seller avg stars, escrow timeline, post-list share moment, demo banner, PWA shell for marketplace — live M-Pesa only after explicit go.
