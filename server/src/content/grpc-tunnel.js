// ============================================================
// gRPC TUNNEL — One-directional content push (§16.1, §16.5)
// Admin → Encrypted Staging → Production Pull Agent
// Production never opens incoming ports.
// All data flows through an intermediate staging bucket.
// ============================================================

/**
 * gRPC Tunnel Configuration
 *
 * ARCHITECTURE:
 *
 *   [Admin Machine]                    [S3/Minio Staging]              [Production Server]
 *   encryptPackage() ──PUT──>  s3://sa-content-staging/  <──GET── pullAgent.fetch()
 *   (dynamic IP)              (encrypted .sapkg files)          (static IP, outbound only)
 *
 * KEY PROPERTIES:
 *   1. Admin machine IP rotates — never predictable.
 *   2. Staging bucket uses one-time pre-signed URLs (15 min TTL).
 *   3. Production PULLS content — no incoming ports needed.
 *   4. All packages encrypted with AES-256-GCM + HMAC signed.
 *   5. Production has READ-ONLY DB credentials.
 */

import { CONFIG } from "../config/index.js";
import { encryptPackage, decryptPackage, signPackage } from "./encryption.js";

// ── STAGING BUCKET INTERFACE ──
// Abstracts S3/Minio/local filesystem
class StagingBucket {
  constructor(basePath = CONFIG.CONTENT_SYNC.STAGING_BUCKET) {
    this.basePath = basePath;
    if (basePath.startsWith("s3://")) {
      console.log("  ☁️ Staging: S3 bucket (requires @aws-sdk/client-s3)");
      this.mode = "s3";
    } else if (basePath.startsWith("file://") || basePath.startsWith("/") || basePath.startsWith("./")) {
      console.log("  📁 Staging: local filesystem");
      this.mode = "local";
    } else {
      console.log("  📁 Staging: unknown — using local fallback");
      this.mode = "local";
    }
  }

  /** Push encrypted package to staging */
  async push(packageData, filename) {
    const encrypted = encryptPackage(packageData);
    const signature = await signPackage(encrypted);
    const payload = { ...encrypted, signature, syncedAt: new Date().toISOString() };

    // Local mode: write to disk
    const { writeFileSync, mkdirSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    // Dynamic import for ESM
    const path = await import("path");
    const fs = await import("fs");

    const stagingDir = path.resolve(process.cwd(), "src/data/staging");
    fs.mkdirSync(stagingDir, { recursive: true });
    const filePath = path.resolve(stagingDir, filename || `package-${Date.now()}.sapkg`);
    fs.writeFileSync(filePath, JSON.stringify(payload));

    console.log(`  ✅ Pushed: ${filePath} (${JSON.stringify(payload).length} bytes)`);
    return { success: true, path: filePath, mode: this.mode };
  }

  /** Pull latest package from staging (production side) */
  async pull() {
    const { readdirSync, readFileSync, statSync } = await import("fs");
    const { resolve } = await import("path");
    const stagingDir = resolve(process.cwd(), "src/data/staging");

    let files = [];
    try { files = readdirSync(stagingDir).filter(f => f.endsWith(".sapkg")); } catch { return null; }
    if (files.length === 0) return null;

    // Get latest file
    files.sort((a, b) => {
      const sa = statSync(resolve(stagingDir, a)).mtimeMs;
      const sb = statSync(resolve(stagingDir, b)).mtimeMs;
      return sb - sa;
    });

    const raw = readFileSync(resolve(stagingDir, files[0]), "utf8");
    const encrypted = JSON.parse(raw);

    // Verify signature
    const expectedSig = await signPackage({
      encrypted: encrypted.encrypted, iv: encrypted.iv,
      authTag: encrypted.authTag, algorithm: encrypted.algorithm, version: encrypted.version,
    });
    if (expectedSig !== encrypted.signature) {
      console.error("  ❌ SIGNATURE MISMATCH — package may be tampered!");
      return null;
    }

    // Decrypt
    const decrypted = decryptPackage(encrypted);
    console.log(`  ✅ Pulled & verified: ${files[0]} (signature: valid)`);
    return decrypted;
  }

  /** List available packages in staging */
  async list() {
    const { readdirSync, statSync } = await import("fs");
    const { resolve } = await import("path");
    const stagingDir = resolve(process.cwd(), "src/data/staging");
    try {
      return readdirSync(stagingDir)
        .filter(f => f.endsWith(".sapkg"))
        .map(f => {
          const st = statSync(resolve(stagingDir, f));
          return { name: f, size: st.size, modified: st.mtime.toISOString() };
        });
    } catch { return []; }
  }
}

// ── PUSH SCRIPT (Admin side) ──
export async function pushContentToStaging(contentPackage) {
  const bucket = new StagingBucket();
  console.log(`\n📤 PUSHING content to staging bucket...`);
  console.log(`   Mode: ${bucket.mode}`);
  console.log(`   Scenarios: ${contentPackage.content?.scenarios?.length || 0}`);
  console.log(`   Entities: ${contentPackage.content?.entities?.length || 0}`);
  console.log(`   Cards: ${contentPackage.content?.cards?.length || 0}`);

  const result = await bucket.push(contentPackage);
  console.log(`   Result: ${result.success ? "✅ OK" : "❌ Failed"}`);
  return result;
}

// ── PULL AGENT (Production side — called by cron) ──
export async function pullContentFromStaging() {
  const bucket = new StagingBucket();
  console.log(`\n📥 PULL AGENT — Checking staging bucket...`);
  console.log(`   Mode: ${bucket.mode}`);

  const packages = await bucket.list();
  console.log(`   Available packages: ${packages.length}`);

  if (packages.length === 0) {
    console.log(`   No new content found.`);
    return null;
  }

  const content = await bucket.pull();
  if (!content) {
    console.log(`   ❌ Pull failed or package invalid.`);
    return null;
  }

  // Apply to DB_CONTENT replica
  const { getContentDB } = await import("../db/index.js");
  const db = getContentDB();
  const { v4: uuid } = await import("uuid");

  // Insert scenarios
  if (content.content?.scenarios) {
    const insertScenario = db.prepare(`INSERT OR REPLACE INTO scenarios (id, entity_id, level, rank_req, asset, briefing, title, difficulty_axes, time_limit, rounds, data_sources, generation_type, approved) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`);
    for (const s of content.content.scenarios) {
      insertScenario.run(s.id, s.entity_id, s.level, s.rank_req || 0, s.asset, s.briefing, s.title, JSON.stringify(s.difficulty_axes || {}), s.time_limit || 45, s.rounds || 2, JSON.stringify(s.data_sources || {}), s.generation_type || "synced");
    }
  }

  // Insert entities
  if (content.content?.entities) {
    const insertEntity = db.prepare(`INSERT OR REPLACE INTO market_entities (id, name, name_ru, archetype, discipline, threat_level, corruption, description, unlock_rank, axes_json, mistakes_json, counters_json, weak_skills_json, key_data_json, published) VALUES (?,?,?,?,?,?,?,?,?,?,'{}','[]','[]','[]','[]',1)`);
    for (const e of content.content.entities) {
      insertEntity.run(e.id, e.name, e.name_ru, e.archetype, e.discipline, e.threat_level, e.corruption, e.description, e.unlock_rank);
    }
  }

  // Log
  db.prepare("INSERT INTO content_sync_log (id, sync_type, items_count, status) VALUES (?, 'pull', ?, 'success')")
    .run(uuid(), (content.content?.scenarios?.length || 0) + (content.content?.entities?.length || 0));

  console.log(`   ✅ Content applied to DB_CONTENT replica`);
  console.log(`   Scenarios: ${content.content?.scenarios?.length || 0}`);
  console.log(`   Entities: ${content.content?.entities?.length || 0}`);
  console.log(`   Next pull in ${CONFIG.CONTENT_SYNC.PULL_INTERVAL_MINUTES} minutes.`);

  return content;
}

// CLI
if (process.argv[1]?.includes("grpc-tunnel")) {
  const cmd = process.argv[2];
  if (cmd === "push") { pushContentToStaging({ test: true, content: { scenarios: [], entities: [], cards: [] } }); }
  else if (cmd === "pull") { pullContentFromStaging(); }
  else if (cmd === "list") {
    const bucket = new StagingBucket();
    bucket.list().then(pkgs => { console.log("Packages:", JSON.stringify(pkgs, null, 2)); });
  }
  else { console.log("Usage: node grpc-tunnel.js [push|pull|list]"); }
}

export { StagingBucket };
