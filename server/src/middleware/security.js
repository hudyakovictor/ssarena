// ============================================================
// SECURITY LAYER (block 5.3) — audit log
//
// Rate limiting itself lives in index.js (manual per-IP hook, global
// 100/min + tight 10/min on /api/auth/* and /api/b2b/*). This file owns
// the tight limits config (RATE_LIMIT_AUTH) and the audit trail:
// JSON lines in data/audit.log — auth failures, recon-looking 404s,
// rate-limit rejections. The plugin is wrapped with fastify-plugin so
// the `audit` decorator reaches every route handler (no encapsulation).
// ============================================================
import { appendFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fp from "fastify-plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIT_PATH = resolve(__dirname, "../../data/audit.log");

let auditReady = false;
async function audit(event, detail = {}) {
  if (!auditReady) {
    auditReady = true;
    try { await mkdir(dirname(AUDIT_PATH), { recursive: true }); } catch { /* noop */ }
  }
  try {
    await appendFile(AUDIT_PATH, JSON.stringify({ ts: new Date().toISOString(), event, ...detail }) + "\n");
  } catch { /* auditing must never break the request */ }
}

// Tight limits for the auth surface (brute force / referral-code /
// B2B-key enumeration). Consumed by the rate-limit hook in index.js.
export const RATE_LIMIT_AUTH = {
  max: 10,
  timeWindow: 60000,
};

export const securityPlugin = fp(
  async (app) => {
    app.decorate("audit", audit);

    app.addHook("onResponse", async (req, reply) => {
      // Auth failures on the auth surface + B2B (key brute force)
      if (reply.statusCode === 401 && (req.url.startsWith("/api/auth") || req.url.startsWith("/api/b2b"))) {
        await audit("auth_failure", { ip: req.ip, path: req.url });
      }
      // Recon-looking 404s (mirrors RECON_PATTERNS from config)
      if (reply.statusCode === 404 && /\/(\.git|\.env|config|wp-admin|phpmyadmin|\.aws|backup)([/?]|$)/.test(req.url)) {
        await audit("recon_404", { ip: req.ip, path: req.url });
      }
      // Rate limit rejections — a flood from one IP is worth a line
      if (reply.statusCode === 429) {
        await audit("rate_limited", { ip: req.ip, path: req.url });
      }
    });
  },
  { name: "securityPlugin", fastify: "4.x" }
);

export { audit };
