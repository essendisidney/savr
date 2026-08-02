/**
 * Refresh seed price freshness for grocery + fuel.
 * Prints SQL you can apply via Supabase MCP / SQL editor.
 *
 * Usage: node scripts/refresh-seed-freshness.js
 */
const sql = `-- Savr seed freshness refresh (${new Date().toISOString().slice(0, 10)})
update public.merchant_prices
set observed_at = now()
where source = 'seed';

update public.fuel_prices
set observed_at = now()
where source = 'seed';
`;

console.log(sql);
console.log("-- Apply with: supabase db execute / MCP apply_migration / SQL editor");
