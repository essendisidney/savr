# Savr Data Model (Phase 1)

PostgreSQL via Supabase. All tables in `public` with **RLS enabled**.

Currency amounts stored as **integer cents** (KES × 100) to avoid float errors. Display as KES with 2 decimals.

---

## ER overview

```
profiles ──────────── wallet_accounts ── wallet_ledger
    │
    ├── shopping_lists ── list_items ── products
    │                        │
    │                   price_observations / merchant_prices
    │
    ├── compares (basket_compares) ── basket_compare_results
    ├── ride_quotes
    └── fuel_checks

merchants ── merchant_locations
    │
    ├── merchant_members (profile ↔ merchant)
    ├── products (via merchant_prices)
    ├── promotions
    └── cashback_rules
```

---

## Core tables

### `profiles`
Extends `auth.users`.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | = auth.users.id |
| full_name | text | |
| phone | text | |
| city | text | default `Nairobi` |
| role | text | `consumer` \| `merchant_admin` |
| preferred_merchant_ids | uuid[] | optional |
| created_at / updated_at | timestamptz | |

### `merchants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| slug | text unique | |
| category | text | `grocery` \| `fuel` \| `ride_partner` \| … |
| logo_url | text | |
| is_verified | boolean | default false |
| created_at | timestamptz | |

### `merchant_locations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| merchant_id | uuid FK | |
| name | text | branch name |
| address | text | |
| lat / lng | float8 | |
| city | text | |
| is_active | boolean | |

### `merchant_members`
| Column | Type | Notes |
|--------|------|-------|
| merchant_id | uuid | |
| profile_id | uuid | |
| role | text | `owner` \| `editor` |
| PK | (merchant_id, profile_id) | |

### `products`
Canonical catalog SKU (not merchant-specific).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| brand | text | |
| category | text | e.g. `dairy`, `staples` |
| unit | text | `piece`, `litre`, `kg` |
| barcode | text | nullable, unique when present |
| search_vector | tsvector | generated / trigger |
| created_at | timestamptz | |

### `merchant_prices`
Current price at a merchant (optionally location-specific).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| merchant_id | uuid FK | |
| location_id | uuid FK | nullable = chain-wide |
| product_id | uuid FK | |
| price_cents | int | |
| currency | text | `KES` |
| in_stock | boolean | |
| observed_at | timestamptz | |
| source | text | `merchant` \| `receipt` \| `crowdsource` \| `scrape` |
| Unique | (merchant_id, location_id, product_id) | treat null location as sentinel |

### `shopping_lists`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| owner_id | uuid FK profiles | |
| name | text | |
| created_at / updated_at | timestamptz | |

### `list_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| list_id | uuid FK | |
| product_id | uuid FK | nullable until matched |
| free_text | text | user-typed name |
| quantity | numeric | default 1 |
| unit | text | |

### `basket_compares`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| list_id | uuid FK | |
| user_id | uuid FK | |
| city | text | |
| created_at | timestamptz | |
| chosen_merchant_id | uuid | nullable until user confirms |
| recommended_merchant_id | uuid | |
| savings_cents | int | vs baseline |
| cashback_cents | int | awarded / pending |

### `basket_compare_results`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| compare_id | uuid FK | |
| merchant_id | uuid FK | |
| total_cents | int | |
| coverage_ratio | numeric | % of items with prices |
| cashback_cents | int | |
| distance_km | numeric | nullable |
| is_recommended | boolean | |

### `ride_quotes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | |
| pickup_label / dest_label | text | |
| pickup_lat/lng, dest_lat/lng | float8 | |
| results | jsonb | `[{partner, price_cents, eta_min, deep_link, estimated}]` |
| recommended_partner | text | |
| created_at | timestamptz | |

### `fuel_stations` + `fuel_prices`
Stations linked to merchants or standalone; prices per litre with `observed_at` and `source`.

### `promotions` / `cashback_rules`
Merchant-configured discounts and cashback; rules engine ranks by **net value to customer**.

### `wallet_accounts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| profile_id | uuid unique | |
| cashback_cents | int | default 0 |
| updated_at | timestamptz | |

### `wallet_ledger`
Append-only.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| account_id | uuid | |
| amount_cents | int | signed |
| entry_type | text | `cashback_earn` \| `redeem` \| `adjust` |
| reference_type / reference_id | text/uuid | e.g. basket_compare |
| note | text | |
| created_at | timestamptz | |

---

## RLS principles

- Consumers: CRUD own lists, compares, wallet read; read public merchants/products/prices
- Merchant members: manage own merchant catalog, prices, promos
- No public write to prices except via authenticated merchant or moderated crowdsource RPC
- Wallet ledger: insert only via **security definer** function / Edge Function (never direct client credit)

---

## Seed data (Nairobi MVP)

- Merchants: Naivas, Quickmart, Carrefour (+ 1–2 independents)
- Ride partners: Bolt, Uber, Little (as `ride_partner` merchants)
- Fuel brands: Rubis, Shell, Total
- ~200–500 staple products with sample prices for demo compares

See migration `00002_seed_nairobi.sql`.
