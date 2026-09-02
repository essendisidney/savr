# Savr Constitution

**The foundation for every employee, designer, engineer, partner, and investor.**

If vision is destination and architecture is the city plan, this is the law of the land — so the company can grow without losing its core purpose.

Related: [VISION.md](./VISION.md) · [ECOSYSTEM.md](./ECOSYSTEM.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [WEDGE.md](./WEDGE.md)

---

## Mission

Help every person in Kenya **sell and buy second-hand with confidence** — money held until the deal is confirmed.

Brand line: **Sell. Buy. Trust.**

---

## What we are building

Savr is the **trust layer for C2C second-hand deals** in Kenya: fast listings, searchable inventory, visible escrow, ratings, and optional seller verification.

We are **not** a grocery compare OS, ride aggregator, fuel board, or scrape-first marketplace. We help people post what they own, pay safely into escrow, meet or confirm delivery, release funds (minus a clear fee), and rate each other.

The app is the entry. The company is the **trusted deal rail**: listings, escrow ledger, M-Pesa pay-in/out, reputation.

---

## Principles

1. **Trust over theatre.** Escrow states must be honest; dry-run until live money is explicitly enabled.
2. **Speed to list.** A listing should take about 60 seconds — photo, title, price.
3. **Money held until confirm.** Buyer pays in; seller is paid only after buyer confirms (or a clear dispute path).
4. **Transparent fees.** Day-1 platform fee is **3%** on release — shown before pay.
5. **No fake scarcity.** No artificial countdowns or invented “only 2 left” on C2C stock.
6. **One geography first.** Nairobi / Kenya urban professionals before expansion.
7. **Reputation is product.** Ratings after release; verification badges when earned, not sold as fake trust.
8. **Consent is product.** Personalization and data use are privileges users can see and revoke.
9. **Ship the spine.** Sell → buy → escrow → rate before AI pricing, categories sprawl, or delivery.
10. **Long-term company.** Optimize for durable trust infrastructure, not a growth-hack quarter.

---

## Product philosophy

| We prefer | We avoid |
|-----------|----------|
| Visible escrow status | Hidden “processing” with no ledger |
| Short post flow | Category mazes and long forms |
| Clear KES prices + fee | Opaque “service charges” |
| Mutual ratings after release | Fake 5-star walls |
| Dry-run M-Pesa until go-live | Surprising live disbursements |
| Honest empty states + demo seeds | Pretending scrape = inventory |

**Three questions before any feature ships**

1. Does it make selling or buying safer or faster?  
2. Does it strengthen escrow, reputation, or listing quality?  
3. Does it stay honest about money movement?  

If none, it does not belong.

---

## User trust commitments

- Show deal status the user can verify (pending pay → in escrow → released / refunded).
- Never imply live M-Pesa when `MPESA_DRY_RUN` is on.
- Prefer “we don’t know yet” over fake precision on delivery or condition.
- Keep escrow events append-only and auditable.
- Make it easy to export or delete personal data as the product and law require.
- Live M-Pesa and fee collection stay off until an explicit founder **go live**.

---

## Data ethics

| Allowed | Not allowed |
|---------|-------------|
| Use consented profile + deal history to improve matching and trust | Sell identity-level deal graphs to third parties |
| Aggregate, anonymized marketplace intelligence | Surreptitious twin-building with no settings |
| Seller sees own listings and open deals | Letting paid boosts fake “verified” status |
| Event streams for product improvement under RLS/privacy | Training public models on private ID docs without policy |

---

## Design language (product)

- Lead with **brand and clarity**, not dashboard clutter.
- One job per screen: sell, find, deal, or profile.
- Prices and escrow copy in plain Kenyan English / clear numbers (KES).
- Atmosphere and craft matter; gimmicks and dark patterns do not.
- Mobile-first for Nairobi urban professionals.
- Accessibility and low-bandwidth respect are part of trust.

---

## Decision-making framework

| Decision type | Who | Rule |
|---------------|-----|------|
| Wedge / category focus | Founders | Second-hand C2C with escrow in Kenya ([WEDGE.md](./WEDGE.md)) |
| Monetization that touches trust | Product + trust review | Boosts labeled; never buy a verified badge that isn’t earned |
| Live payments / M-Pesa | Explicit founder go | Default dry-run |
| Geo expansion | After playbook repeats | One market at a time |
| “Cool” features vs spine | Engineering default | Spine wins (list, pay, confirm, rate) |

When unsure: **choose the option that increases Trust and completed honest deals**, even if it grows slower.

---

## 10-year roadmap (constitutional summary)

| Horizon | Promise |
|---------|---------|
| **Now** | Kenya C2C marketplace MVP: 60s list, search, escrow dry-run, ratings |
| **Near** | Live M-Pesa, denser inventory, verification ops, light boosts |
| **Mid** | Stronger dispute tools; optional categories; partner logistics plugs |
| **Long** | Multi-city trust rail; deeper reputation graph |
| **North star** | The place Kenya trusts to sell and buy second-hand |

---

## How to use this document

- **Hire / onboard:** read Constitution → Wedge → app surface.  
- **Design / eng:** three questions + trust commitments on every PR that touches escrow, fees, or reputation.  
- **Conflict:** Constitution overrides a flashy roadmap slide.

Amendments should be rare, written, and explicit — culture drifts by silence, not by debate.
