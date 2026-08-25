// ============================================================
// ANTI-RECONNAISSANCE MIDDLEWARE ($16.6)
// Detects port scanning & hidden directory enumeration
// ============================================================
import { CONFIG } from "../config/index.js";

const bannedIPs = new Map();
const suspiciousIPs = new Map();

export async function antiReconMiddleware(req, reply) {
  const ip = req.ip || "unknown";
  const url = req.url || "";
  const method = req.method || "GET";

  // Check if IP is banned
  if (bannedIPs.has(ip)) {
    const banUntil = bannedIPs.get(ip);
    if (Date.now() < banUntil) {
      return reply.code(403).send({
        error: "Access Denied",
        layer1: "◆ Connection Throttled",
        layer2: "Your client's latency limit has been set to 5000ms.",
        layer3: "Reconnaissance activity detected. Return to reading candles before permanent action.",
      });
    }
    bannedIPs.delete(ip);
  }

  // Check for recon patterns
  const matchedPattern = CONFIG.SECURITY.RECON_PATTERNS.find((p) => url.toLowerCase().includes(p));

  // Loopback / private clients are the server's own admin, not a recon
  // scanner. The pattern check exists to punish external enumeration of
  // hidden paths (/.git, /config, /admin...), not the local admin API.
  const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1"
    || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.")
    || ip.startsWith("172.17.") || ip.startsWith("172.18.") || ip.startsWith("172.19.")
    || ip.startsWith("172.2") || ip.startsWith("172.30.") || ip.startsWith("172.31.");

  if (matchedPattern && !isLocal) {
    // Track suspicious behavior
    const count = (suspiciousIPs.get(ip) || 0) + 1;
    suspiciousIPs.set(ip, count);

    if (count >= 3) {
      bannedIPs.set(ip, Date.now() + CONFIG.SECURITY.RECON_BAN_DURATION_MS);
      console.warn(`🛡 BANNED: ${ip} — Reconnaissance detection (${count} hits)`);
    }

    // Apply latency penalty
    await new Promise((r) => setTimeout(r, CONFIG.SECURITY.RECON_LATENCY_PENALTY_MS));

    // Return the Terminal Voice response
    return reply.code(404).send({
      error: "Not Found",
      layer1: "◆ SYSTEM ALERT: RECONNAISSANCE DETECTED",
      layer2: "There is no control panel on this server. The steering wheel is not connected to the dashboard.",
      layer3: `Attention, curious entity. You are scanning ports and looking for a cockpit. Let us save you some bandwidth: there is no admin panel here. Go back to reading candles before we permanently close your order book. (Hit #${count})`,
    });
  }
}

// Export for manual ban/unban
export function banIP(ip, durationMs = 3600000) {
  bannedIPs.set(ip, Date.now() + durationMs);
}

export function unbanIP(ip) {
  bannedIPs.delete(ip);
}

export function getBanList() {
  return Array.from(bannedIPs.entries()).map(([ip, until]) => ({ ip, bannedUntil: new Date(until).toISOString() }));
}
