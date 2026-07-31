# Savr Wedge Decision

**Decision: Groceries basket compare is the Phase 1 habit-former.**

Ride-hailing and fuel ship in MVP as retention hooks, not as the primary growth loop.

---

## Criteria

| Criterion | Why it matters |
|-----------|----------------|
| Weekly frequency | Habit formation needs repeated opens |
| Clear savings delta | User must feel “Savr was worth it” |
| Data acquireability | Can we seed prices without perfect APIs? |
| Supply-side path | Merchants can join and compete |
| Viral / share moment | Household lists, “look what we saved” |
| Monetization path | Affiliates, cashback, merchant subs |

---

## Scorecard (1–5)

| Option | Frequency | Savings clarity | Data | Supply | Share | Monetize | **Total** |
|--------|-----------|-----------------|------|--------|-------|----------|-----------|
| **Groceries basket** | 5 | 5 | 4 | 5 | 5 | 4 | **28** |
| Ride-hailing | 4 | 4 | 2 | 2 | 3 | 3 | **18** |
| Fuel | 3 | 3 | 4 | 3 | 2 | 3 | **18** |

---

## Why groceries wins

1. **Highest intentional spend.** Households plan lists; Savr sits *before* the trip, not after impulse.
2. **Basket compare is the OS moment.** Single-SKU compare is a feature. Whole-list compare is the product.
3. **Merchant portal has a job.** Supermarkets and dukas upload catalogs/promos → competition on value.
4. **Family Mode is natural.** Shared lists deepen retention without Phase 2 complexity.
5. **Receipt flywheel.** Upload after shopping → “You could have saved KES X” → trust + price data.

## Why rides are not the wedge

- Quote APIs are partner-gated; deep-links alone feel thin.
- Comparison is often small (KES 50–150) and time-sensitive; harder to build lasting trust.
- Supply side is 2–3 oligopolists, not a marketplace Savr can shape.

**Keep rides in MVP** as a fast “wow” screen and daily utility — not the acquisition engine.

## Why fuel is not the wedge

- Price deltas per litre are small; savings feel real only at tank scale.
- Station coverage is local and operationally messy (crowdsourced + partner feeds).
- Strong complement to groceries (“fill up on the way to Carrefour”) — ship as nearby utility.

---

## Phase 1 north star

> **Nairobi household opens Savr before the weekly shop, compares a list across Naivas / Quickmart / Carrefour (and peers), picks the best total + cashback, and comes back next week.**

### Success metrics (first 90 days)

| Metric | Target |
|--------|--------|
| Weekly active users who run ≥1 basket compare | 40% of MAU |
| Median basket savings shown | ≥ KES 200 |
| Lists with ≥5 items | ≥ 50% of compares |
| Merchant catalog SKUs (seeded + partner) | ≥ 5,000 staples |
| Cashback earned on recommended merchant | ≥ 30% of completed compares (when redemption path exists) |

### Explicit non-goals for wedge period

- Becoming a ride super-app
- Full electronics / fashion catalogs
- AI chat shopping agent
- Cross-border expansion

---

## Sequencing

```
Week 1–4   Seed staple catalog + 3–5 grocery merchants (Nairobi)
Week 4–8   Basket compare + savings cashback ledger
Week 8–12  Ride quotes (deep-link or partner) + fuel nearby
Week 12+   Receipt “could have saved” + family lists
```

Rides and fuel launch when grocery compare retention is proven — or earlier as thin utilities if they don’t distract engineering from catalog quality.
