// ============================================================
// CONTENT PACKAGE ENCRYPTION (§16.1)
// All content packages are encrypted before push to staging.
// Production pull agent decrypts with shared key.
// Uses AES-256-GCM via Node crypto (no external deps).
// ============================================================
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync } from "crypto";
import { CONFIG } from "../config/index.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function deriveKey(password) {
  const salt = CONFIG.CONTENT_SYNC.ENCRYPTION_KEY
    ? Buffer.from(CONFIG.CONTENT_SYNC.ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0"))
    : randomBytes(32);
  return scryptSync(password || "signal-arena-content-key", salt, 32);
}

/**
 * Encrypt a content package before pushing to staging.
 * @param {object} contentPackage - The sync package to encrypt
 * @returns {{ encrypted: Buffer, iv: Buffer, authTag: Buffer, salt: Buffer }}
 */
export function encryptPackage(contentPackage) {
  const json = JSON.stringify(contentPackage);
  const key = deriveKey(CONFIG.CONTENT_SYNC.ENCRYPTION_KEY || "default-key-change-me");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(json, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    algorithm: ALGORITHM,
    version: "2.0.0",
    encryptedAt: new Date().toISOString(),
  };
}

/**
 * Decrypt a content package (production pull agent side).
 * @param {object} encryptedPackage - { encrypted, iv, authTag }
 * @returns {object} Decrypted content package
 */
export function decryptPackage(encryptedPackage) {
  const key = deriveKey(CONFIG.CONTENT_SYNC.ENCRYPTION_KEY || "default-key-change-me");
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encryptedPackage.iv, "base64"));
  decipher.setAuthTag(Buffer.from(encryptedPackage.authTag, "base64"));

  let decrypted = decipher.update(Buffer.from(encryptedPackage.encrypted, "base64"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Generate SHA256 checksum for integrity verification.
 */
export function generateChecksum(data) {
  const json = typeof data === "string" ? data : JSON.stringify(data);
  return createHash("sha256").update(json).digest("hex");
}

/**
 * Sign a content package with HMAC for tamper detection.
 */
export function signPackage(contentPackage) {
  const key = CONFIG.CONTENT_SYNC.ENCRYPTION_KEY || "default-key";
  const json = JSON.stringify(contentPackage);
  return createHmac("sha256", key).update(json).digest("hex");
}

// CLI usage
if (process.argv[1]?.includes("encryption")) {
  const testPkg = { test: true, data: "Signal Arena content package", timestamp: new Date().toISOString() };
  console.log("🔐 Testing encryption...");
  const enc = encryptPackage(testPkg);
  console.log(`   Encrypted: ${enc.encrypted.slice(0, 50)}... (${enc.encrypted.length} chars)`);
  const dec = decryptPackage(enc);
  console.log(`   Decrypted: ${JSON.stringify(dec)}`);
  console.log(`   Match: ${dec.test === true ? "✅" : "❌"}`);
}
