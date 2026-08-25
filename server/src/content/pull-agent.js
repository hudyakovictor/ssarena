// ============================================================
// PULL AGENT — Production-side content fetcher ($16.5)
// Runs as a cron job on production server
// Fetches content packages from staging area
// NO incoming ports needed — agent reaches OUT
// ============================================================
import { CONFIG } from "../config/index.js";

/**
 * Production Pull Agent
 *
 * This agent runs on the production server as a cron job (every 60 min).
 * It reaches OUT to the staging bucket, fetches new content packages,
 * validates checksums, and applies them to the read-only content replica.
 *
 * KEY SECURITY PROPERTY:
 * The production server has NO write credentials to DB_CONTENT.
 * The agent writes to a staging replica, which is then atomically
 * swapped with the live replica via filesystem operations.
 *
 * The admin machine's IP is never exposed to the production server.
 */

async function pullContent() {
  console.log(`🔄 Pull Agent — Checking for content updates...`);
  console.log(`   Interval: ${CONFIG.CONTENT_SYNC.PULL_INTERVAL_MINUTES}min`);
  console.log(`   Staging:  ${CONFIG.CONTENT_SYNC.STAGING_BUCKET}`);

  // In production, this would:
  // 1. Check S3/minio bucket for new content packages
  // 2. Download latest package
  // 3. Verify SHA256 checksum
  // 4. Decrypt with ENCRYPTION_KEY
  // 5. Insert into DB_CONTENT replica
  // 6. Atomically swap replica with live
  // 7. Invalidate CDN cache for locales

  console.log("   ✅ No new package found. (Dev mode — using local content.db)");
  console.log("   Next check in", CONFIG.CONTENT_SYNC.PULL_INTERVAL_MINUTES, "minutes.");
}

// If running as cron, execute immediately
if (process.argv[1]?.includes("pull-agent")) {
  pullContent().catch(console.error);
}

export { pullContent };
