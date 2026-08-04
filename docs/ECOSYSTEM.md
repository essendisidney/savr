# Savr Ecosystem

**The Spending OS** — data and decision infrastructure for how Africa spends money.

The app is the entry point. The company is the layer behind every purchase decision.

> Ambition: not “best price comparison app” — **infrastructure that powers how Africa spends money.**  
> Analog: what Google became for information — not the seller, the first place people go to decide.

---

## What the user sees

One surface. Five verbs.

```
Compare · Save · Earn · Pay · Invest
```

Consumers and businesses both sit on the same OS; they use different doors.

---

## Platforms behind the app

| # | Platform | Job | Who |
|---|----------|-----|-----|
| 1 | **Savr Consumer** | Spend less, smarter | Households |
| 2 | **Savr Merchant** | Compete on value; acquire customers | Retailers & services |
| 3 | **Savr Business** | Procurement intelligence | SMEs & enterprises |
| 4 | **Savr API** | Embed comparison & offers | Banks, fintechs, travel, insurers |
| 5 | **Savr AI** | Answer spend questions, not search lists | All users |
| 6 | **Savr Wallet** | Unify of cashback, coupons, credits, miles | Consumers |
| 7 | **Savr Rewards Network** | Standardized merchant rewards → one consumer currency | Merchants ↔ consumers |
| 8 | **Savr Intelligence** | Anonymized aggregated demand & brand-shift insights | Retail, CPG, banks |
| 9 | **Savr Ads** | Buy *savings* (value-based ranking), not keywords | Merchants |
| 10 | **Savr Finance** | Contextual credit / BNPL / SACCO at decision time | Lenders ↔ shoppers |
| 11 | **Savr Protect** | Insurance & warranty in the purchase flow | Insurers ↔ shoppers |
| 12 | **Savr Community** | Verified deals, drops, gems | Users |

`Savr Labs` sits beside these as R&D / new category experiments.

---

### 1 — Savr Consumer

The downloadable app.

**Modules:** price comparison · shopping lists · ride comparison · cashback · wallet · AI assistant · spending analytics.

Phase 1 ships a thin slice: basket compare (wedge) + rides + fuel + wallet ledger + merchant shell. See [WEDGE.md](./WEDGE.md) and [MVP_PRD.md](./MVP_PRD.md).

### 2 — Savr Merchant

Dashboard for every supermarket, pharmacy, electronics store, hardware shop, restaurant.

Upload products · update prices · flash sales · issue cashback · respond to reviews · competitor analytics.

This is their **customer acquisition platform** — compete on value, not only louder ads.

### 3 — Savr Business

Company procurement: fuel, laptops, stationery, internet, printers — cheapest *approved* supplier automatically.

Procurement intelligence. Large orgs save at scale.

### 4 — Savr API

Serve developers, not only end users.

Bank embeds “Best TV under KES 50,000.” Insurance, travel, retail, fintech call the same comparison / offers stack.

**This is the infrastructure moment** — Savr becomes a dependency, not a destination app alone.

### 5 — Savr AI (crown jewel)

Users ask; Savr searches, ranks, explains, finds cashback, financing, warranty — one answer.

Example: “I have KES 25,000. What is the best phone?”

### 6 — Savr Wallet

Not only cashback. Eventually: cash, gift cards, loyalty points, coupons, merchant credits, travel miles, reward tokens.

Users stop caring where rewards originated. Everything settles in Savr Wallet.

### 7 — Savr Rewards Network

Standardize merchant offers (Quickmart 3%, Naivas 5%, Java 10%, Bolt KES 30…) into **one consumer reward currency**. Merchants get a simple competition surface.

### 8 — Savr Intelligence

Aggregated, anonymized insights only — never sell individual identities.

Examples: brand A→B shift in Nairobi; cooking oil demand +14% in Kisumu; households spending more on transport than food.

Buyers: retailers, manufacturers, banks — with strict privacy policy as a product feature.

### 9 — Savr Ads (value-based)

Merchants don’t buy keywords. They buy **savings** (cashback / price moves) that improve net value.

If Store C’s cashback makes total value best, Savr recommends Store C. Advertising aligns with consumer trust.

### 10 — Savr Finance

At decision time: bank, BNPL, employer credit, SACCO — best repayment path. Referral revenue.

### 11 — Savr Protect

Contextual insurance / warranty / travel cover / theft protection in the purchase flow.

### 12 — Savr Community

Shared deals, coupons, price drops, hidden gems — **verified**, not a spam forum.

---

## Dual flywheels

**Demand**

```
More users → more prices → better AI → better recommendations
→ more savings → more cashback → more users
```

**Supply**

```
More merchants → more deals → more customers → more revenue → more merchants
```

Both sides reinforce. Copying the UI is easy; copying the data network is not.

---

## Five-year product moment

> “Cheapest way to furnish a two-bedroom apartment in Nairobi?”

Savr builds the **plan**: furniture · delivery · assembly · financing · cashback · warranty.

> Total KES 178,430. Saved KES 24,980 vs market average.

That is an AI decision engine — not a shopping app.

---

## Company structure

```
Savr Technologies
├── Savr Consumer
├── Savr Merchant
├── Savr Business
├── Savr Wallet
├── Savr Rewards
├── Savr AI
├── Savr API
├── Savr Intelligence
├── Savr Finance
├── Savr Protect
└── Savr Labs
```

Org chart follows platforms, not screens. Engineering modules should map to these boundaries early (shared catalog, offers, wallet ledger, identity) so API / Business / Intelligence are not rewrites later.

---

## Sequencing rule

Expand **one category and one geography at a time** without shrinking the destination.

| Horizon | Platforms that must exist in some form |
|---------|----------------------------------------|
| Phase 1 (now) | Consumer (wedge) · Merchant (thin) · Wallet (ledger) · Rewards (simple cashback rules) |
| Phase 2–3 | AI (assist) · Community (light) · Ads (labeled value offers) |
| Phase 3–4 | API · Business · Finance · Protect |
| Scale | Intelligence productization · full Rewards Network · Labs |

Schema and RLS should stay **platform-shaped** (merchants, prices, offers, wallet, compares) so later platforms plug in rather than fork the data model. See [DATA_MODEL.md](./DATA_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md) for data flow, ranking stages, and when banks / brands / logistics unlock.

---

## Non-negotiables

1. **Trust > monetization.** Sponsored / cashback boosts only win when net value to the user is best — and must be explainable.
2. **Privacy by design** for Intelligence — aggregated only.
3. **App is not the company.** Every feature either improves the decision graph or the merchant/developer network.
