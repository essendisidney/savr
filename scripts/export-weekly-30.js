/**
 * Print soft-launch Weekly 30 CSV path reminder.
 * The walk sheet lives at ops/weekly-30-walk.csv
 * In the app: Merchant portal → Download Weekly 30
 *
 * Usage: node scripts/export-weekly-30.js
 */
const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "..", "ops", "weekly-30-walk.csv");
const text = fs.readFileSync(csvPath, "utf8");
process.stdout.write(text);
console.error(`\n-- ${csvPath.split(/[/\\]/).slice(-2).join("/")} · fill price_kes per branch, upload in /merchant`);
