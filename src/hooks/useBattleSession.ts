import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

// ============================================================
// BATTLE SESSION — server-backed battle lifecycle
// Block 1.2/1.5: prebattle → scenario+options from content DB,
// decide → scored & persisted on the server.
// Falls back to null (pure local mode) when server unreachable.
// ============================================================
export interface ServerScenario {
  id: string;
  entity_id: string;
  title: string;
  briefing: string;
  asset: string;
  level: number;
  time_limit: number;
  rounds: number;
  options: { id: string; opt_index: string; label: string; correct: number; layer1: string; layer2: string; layer3: string }[];
}

interface SessionState {
  sessionId: string | null;
  scenario: ServerScenario | null;
  loading: boolean;
  error: string | null;
  mode: string;
}

export function useBattleSession() {
  const [st, setSt] = useState<SessionState>({
    sessionId: null, scenario: null, loading: false, error: null, mode: "daily",
  });

  const start = useCallback(async (playerId: string, mode: string, scenarioId?: string) => {
    if (!playerId) { setSt((s) => ({ ...s, error: "no player id" })); return null; }
    setSt((s) => ({ ...s, loading: true, error: null, mode }));
    try {
      const res: any = await api.startPreBattle(playerId, scenarioId || "", mode);
      const next = {
        sessionId: res.sessionId,
        scenario: res.scenario as ServerScenario,
        loading: false, error: null as string | null, mode,
      };
      setSt(next);
      return next;
    } catch (e: any) {
      // Server down: try to get at least a scenario shape so UI can degrade gracefully
      setSt((s) => ({ ...s, loading: false, error: e?.message || "server unreachable", scenario: null, sessionId: null }));
      return null;
    }
  }, []);

  const submitDecision = useCallback(async (optionId: string) => {
    if (!st.sessionId) return null;
    try {
      const res: any = await api.submitDecision(st.sessionId, optionId);
      setSt({ sessionId: null, scenario: null, loading: false, error: null, mode: st.mode });
      return res;
    } catch (e: any) {
      setSt({ sessionId: null, scenario: null, loading: false, error: e?.message || "submit failed", mode: st.mode });
      return null;
    }
  }, [st.sessionId, st.mode]);

  const getTwist = useCallback(async () => {
    if (!st.sessionId) return null;
    try { return await api.triggerTwist(st.sessionId); } catch { return null; }
  }, [st.sessionId]);

  const reset = useCallback(() => {
    setSt({ sessionId: null, scenario: null, loading: false, error: null, mode: "daily" });
  }, []);

  return { session: st, start, submitDecision, getTwist, reset };
}

// ── Candles: server-backed with local fallback ──
export async function fetchCandles(seed: string, count = 60): Promise<any[] | null> {
  try {
    const res: any = await api.getServerCandles(seed, count);
    return Array.isArray(res.candles) && res.candles.length ? res.candles : null;
  } catch {
    return null;
  }
}
