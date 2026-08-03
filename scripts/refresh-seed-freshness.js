/**
 * DO NOT bump seed observed_at to now().
 * That made the UI say “just now” on invented catalog seed — trust-breaking.
 *
 * Accuracy comes from Weekly 30 walks + shopper tips + merchant uploads.
 * Prefer: /ops → Download Weekly 30 → walk → /merchant upload.
 *
 * If you need a migration to *clear* fake freshness, use something like:
 *
 *   -- optional honesty reset (not auto-run)
 *   -- update public.merchant_prices set observed_at = null where source = 'seed';
 *   -- update public.fuel_prices set observed_at = null where source = 'seed';
 */
console.log(`-- Savr: refuse fake seed clocks (${new Date().toISOString().slice(0, 10)})
-- Do NOT set observed_at = now() on source='seed'.
-- Run a Weekly 30 shelf walk instead: /ops → download CSV → /merchant upload.
`);
