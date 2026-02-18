/**
 * Find skipped Skinport items = Skinport API items that were NOT upserted into marketplace_items.
 *
 * Compares by (remote_name, phase) where:
 * - remote_name in DB = Skinport market_hash_name
 * - phase in DB = Skinport version (e.g. "Phase 1") or null
 *
 * Requires:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node find_skipped_skinport.mjs
 */

import fs from "node:fs/promises";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env vars SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Skinport API – CS2, EUR
const SKINPORT_ITEMS_URL =
  "https://api.skinport.com/v1/items?app_id=730&currency=EUR";

// Marketplace id in deiner DB
const MARKETPLACE_ID = 2;

// --- helpers ---
function normStr(x) {
  if (typeof x !== "string") return null;
  const s = x.trim();
  return s.length ? s : null;
}

function makeKey(name, phase) {
  // keep it exact; phase can be null
  return `${name}::${phase ?? ""}`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 500)}`);
  }
}

async function fetchAllMarketplaceItems() {
  // Use PostgREST directly to avoid pulling supabase-js deps.
  // Paginate via Range headers.
  const base = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/marketplace_items`;

  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const url = new URL(base);
    // only what we need
    url.searchParams.set("select", "remote_name,phase");
    url.searchParams.set("marketplace_id", `eq.${MARKETPLACE_ID}`);

    const res = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Range: `${from}-${from + pageSize - 1}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Supabase fetch failed (range ${from}-${from + pageSize - 1}): HTTP ${
          res.status
        } ${text.slice(0, 500)}`
      );
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    rows.push(...data);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function main() {
  console.log("1) Fetching Skinport items...");
  const skinportItems = await fetchJson(SKINPORT_ITEMS_URL, {
    headers: { Accept: "application/json" },
  });

  if (!Array.isArray(skinportItems)) {
    throw new Error("Skinport response is not an array");
  }

  console.log("   Skinport items:", skinportItems.length);

  console.log("2) Fetching marketplace_items from Supabase (marketplace_id=2)...");
  const dbItems = await fetchAllMarketplaceItems();
  console.log("   DB marketplace_items rows:", dbItems.length);

  // Build a set of keys from DB
  const dbKeySet = new Set();
  for (const row of dbItems) {
    const name = normStr(row.remote_name);
    const phase = normStr(row.phase);
    if (!name) continue;
    dbKeySet.add(makeKey(name, phase));
  }

  // Compare
  const skipped = [];
  let skinportWithPhase = 0;
  let skinportWithoutPhase = 0;

  for (const it of skinportItems) {
    const name = normStr(it.market_hash_name);
    const phase = normStr(it.version); // "Phase 1" etc. or null
    if (!name) continue;

    if (phase) skinportWithPhase++;
    else skinportWithoutPhase++;

    const key = makeKey(name, phase);
    if (!dbKeySet.has(key)) {
      skipped.push({
        market_hash_name: name,
        version: phase,
        item_page: normStr(it.item_page) ?? null,
        market_page: normStr(it.market_page) ?? null,
      });
    }
  }

  // Summaries
  const skippedCount = skipped.length;
  const matchedCount = skinportItems.length - skippedCount;

  console.log("3) Results");
  console.log("   matched:", matchedCount);
  console.log("   skipped:", skippedCount);
  console.log("   skinport with version:", skinportWithPhase);
  console.log("   skinport without version:", skinportWithoutPhase);

  // Group by simple reason hints (optional)
  const hintCounts = new Map();
  for (const s of skipped) {
    const n = s.market_hash_name;
    let hint = "other";
    if (/sticker|capsule/i.test(n)) hint = "sticker/capsule";
    else if (/souvenir package/i.test(n)) hint = "souvenir package";
    else if (/autograph/i.test(n)) hint = "autograph";
    else if (/pin\b/i.test(n)) hint = "pin";
    else if (/viewer pass/i.test(n)) hint = "viewer pass";
    else if (/\bagent\b|\|/i.test(n) && /\|/.test(n)) hint = "agent/character";
    hintCounts.set(hint, (hintCounts.get(hint) ?? 0) + 1);
  }

  console.log("   skipped breakdown (rough):");
  for (const [k, v] of [...hintCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`     - ${k}: ${v}`);
  }

  // Write file
  await fs.writeFile(
    "skipped_skinport.json",
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        marketplace_id: MARKETPLACE_ID,
        total_skinport_items: skinportItems.length,
        total_db_rows: dbItems.length,
        matched: matchedCount,
        skipped: skippedCount,
        skipped_items: skipped,
      },
      null,
      2
    )
  );

  console.log("\nWrote skipped_skinport.json");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
