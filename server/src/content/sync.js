// ============================================================
// CONTENT SYNC — Push from Admin to Staging/Production
// One-directional push with encryption ($16.1)
// Run: node src/content/sync.js
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import { createHash } from "crypto";
import { CONFIG } from "../config/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Deterministic JSON: recursive key sort, no whitespace — stable across runs.
function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(value[k])).join(",") + "}";
}

async function syncContent() {
  console.log("📦 Signal Arena — Content Sync Pipeline");
  console.log("   Mode: PUSH (Admin → Staging)");
  console.log("");

  const db = (await import("../db/index.js")).getContentDB();

  // Compile all published content
  const scenarios = db.prepare("SELECT * FROM scenarios WHERE approved = 1").all();
  const entities = db.prepare("SELECT * FROM market_entities WHERE published = 1").all();
  const cards = db.prepare("SELECT * FROM skill_cards WHERE published = 1").all();
  const locales = db.prepare("SELECT * FROM locales ORDER BY lang, module").all();

  // Compile locales to flat JSON
  const localeMap = {};
  for (const row of locales) {
    if (!localeMap[row.lang]) localeMap[row.lang] = {};
    if (!localeMap[row.lang][row.module]) localeMap[row.lang][row.module] = {};
    localeMap[row.lang][row.module][row.locale_key] = row.value;
  }

  // Content body first (checksum needs it)
  const content = {
    scenarios: scenarios.map((s) => ({
      ...s,
      data_sources: JSON.parse(s.data_sources || "{}"),
      difficulty_axes: JSON.parse(s.difficulty_axes || "{}"),
    })),
    entities,
    cards,
  };
  // Checksum: SHA256 over a canonical (key-sorted, whitespace-free) dump of
  // the content only — deterministic across runs so a pull agent can detect
  // any tampering or drift in the package. (separate from the pack HMAC sig)
  const checksum = createHash("sha256").update(canonicalJson(content)).digest("hex");

  const syncPackage = {
    version: "2.0.0",
    syncedAt: new Date().toISOString(),
    syncId: uuid(),
    content,
    locales: localeMap,
    checksum,
  };

  // Save to staging directory
  const stagingDir = resolve(__dirname, "../data/staging");
  mkdirSync(stagingDir, { recursive: true });

  const packagePath = resolve(stagingDir, `content-package-${Date.now()}.json`);
  writeFileSync(packagePath, JSON.stringify(syncPackage, null, 2));

  console.log(`  ✅ Compiled: ${scenarios.length} scenarios, ${entities.length} entities, ${cards.length} cards`);
  console.log(`  🌍 Locales: ${Object.keys(localeMap).join(", ")}`);
  console.log(`  📁 Saved to: ${packagePath}`);
  console.log("");
  console.log(`  Next step: Upload to ${CONFIG.CONTENT_SYNC.STAGING_BUCKET || "staging bucket"}`);
  console.log(`  Production pull agent will fetch within ${CONFIG.CONTENT_SYNC.PULL_INTERVAL_MINUTES} minutes.`);

  // Log sync
  db.prepare("INSERT INTO content_sync_log (id, sync_type, items_count) VALUES (?, 'compile', ?)")
    .run(uuid(), scenarios.length + entities.length + cards.length);

  return syncPackage;
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncContent().catch(console.error);
}

export { syncContent };
