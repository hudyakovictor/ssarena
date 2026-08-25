import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

// ============================================================
// PLAYER AUTH — guest JWT login + identity persistence
// Block 1.4: the battle server needs a stable playerId.
// Guest mode: no wallet, token stored in localStorage.
// Fallback to local-only id if server unreachable.
// ============================================================
interface PlayerIdentity {
  playerId: string;
  guestId: string;
  displayName: string;
  token: string;
  authenticated: boolean; // true when server issued a JWT
  loading: boolean;
}

const KEY = "signal-arena-player";

// Block 4.1: referral deep-link (?ref=CODE) — consumed exactly once,
// during the very first guest login of this browser, then stripped.
function consumeRefCode(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("ref") || params.get("referral") || "").trim().toUpperCase();
    if (code) {
      params.delete("ref");
      params.delete("referral");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? "?" + qs : window.location.pathname);
      sessionStorage.setItem("sa_ref_consumed", code);
    }
  } catch { /* no URL (SSR/test) */ }
  return "";
}

async function obtainIdentity(): Promise<PlayerIdentity> {
  try {
    const firstRun = !localStorage.getItem(KEY);
    const refCode = firstRun ? consumeRefCode() : sessionStorage.getItem("sa_ref_consumed") || "";
    try { sessionStorage.removeItem("sa_ref_consumed"); } catch {}
    const res: any = await api.guestLogin(refCode || undefined);
    return {
      playerId: res.playerId,
      guestId: res.guestId || "",
      displayName: res.displayName || "AnonTrader",
      token: res.token || "",
      authenticated: true,
      loading: false,
    };
  } catch {
    // Server down — local-only id, game still loads offline
    return {
      playerId: "local_" + Math.random().toString(36).slice(2, 10),
      guestId: "", displayName: "AnonTrader", token: "",
      authenticated: false, loading: false,
    };
  }
}

function loadStored(): PlayerIdentity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p.playerId && (p.token || p.playerId.startsWith("local_"))) {
      return { ...p, loading: false };
    }
  } catch { /* corrupted */ }
  return null;
}

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerIdentity>(() => {
    const stored = loadStored();
    return stored || { playerId: "", guestId: "", displayName: "", token: "", authenticated: false, loading: true };
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = loadStored();
      if (stored) {
        if (!cancelled) setPlayer(stored);
        return;
      }
      const identity = await obtainIdentity();
      localStorage.setItem(KEY, JSON.stringify(identity));
      if (!cancelled) setPlayer(identity);
    })();
    return () => { cancelled = true; };
  }, [nonce]);

  const rename = useCallback((name: string) => {
    const clean = (name || "").trim().slice(0, 24);
    if (clean.length < 2) return;
    setPlayer((p) => {
      const next = { ...p, displayName: clean };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const relogin = useCallback(() => {
    localStorage.removeItem(KEY);
    setPlayer({ playerId: "", guestId: "", displayName: "", token: "", authenticated: false, loading: true });
    setNonce((n) => n + 1);
  }, []);

  return { player, rename, relogin };
}
