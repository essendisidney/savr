# Savr price scrapers

Pull **public** online prices into `merchant_prices` with `source = scrape`.

## Honesty rules

- Never labeled as merchant / verified / tip
- Never overwrites `merchant`, `crowdsource`, `tip`, `partner`, `verified`
- UI treats scrape like catalog seed (confirm on shelf)
- Online marketplace ≠ Naivas aisle — Jumia lands under merchant **Jumia**

## Sources

| Adapter | Status | Notes |
|---------|--------|-------|
| `jumia` | Works from most networks | Public catalog HTML |
| `carrefour` | Often bot-challenged | Soft-fails; shelf walk still required |

Naivas / Quickmart shelf boards are **not** reliably public — use Weekly 30 + tips.

## Run

```bash
# Dry-run (writes ops/scrape-report-*.json)
node scripts/scrapers/run.js --limit=10

# Jumia only, apply to Supabase
node scripts/scrapers/run.js --source=jumia --apply

# Needs apps/web/.env.local:
# NEXT_PUBLIC_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

Also needs `@supabase/supabase-js` (from `apps/web/node_modules` or install at repo root).

```bash
node -e "require('module').Module._resolveFilename=function(r,p){try{return require('module')._resolveFilename.call(this,r,p)}catch(e){return require('path').join('apps/web/node_modules',r)}}"
# simpler: run with NODE_PATH
NODE_PATH=apps/web/node_modules node scripts/scrapers/run.js --source=jumia --limit=5
```

On Windows PowerShell:

```powershell
$env:NODE_PATH="d:\savr\apps\web\node_modules"
node scripts/scrapers/run.js --source=jumia --limit=5
```

## Soft launch

Scrapes densify **online** compare. Trust for Nairobi **shelf** still comes from `/ops` Weekly 30 walks.
