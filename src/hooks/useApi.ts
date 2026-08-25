import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

// ── PLAYER ──
export function usePlayer(playerId?: string) {
  return useQuery({
    queryKey: ["player", playerId],
    queryFn: () => api.getPlayer(playerId || "demo"),
    enabled: !!playerId,
    staleTime: 15000,
  });
}

export function usePlayerErrors(playerId?: string) {
  return useQuery({
    queryKey: ["player-errors", playerId],
    queryFn: () => api.getErrors(playerId || "demo"),
    enabled: !!playerId,
  });
}

export function usePlayerBattles(playerId?: string, limit = 20) {
  return useQuery({
    queryKey: ["player-battles", playerId, limit],
    queryFn: () => api.getBattles(playerId || "demo", limit),
    enabled: !!playerId,
  });
}

export function usePlayerEntities(playerId?: string) {
  return useQuery({
    queryKey: ["player-entities", playerId],
    queryFn: () => api.getEntities(playerId || "demo"),
    enabled: !!playerId,
  });
}

export function useShareCard(playerId?: string) {
  return useQuery({
    queryKey: ["share-card", playerId],
    queryFn: () => api.getShareCard(playerId || "demo"),
    enabled: !!playerId,
  });
}

// ── GAME ──
export function useDailyScenario(playerId?: string) {
  return useQuery({
    queryKey: ["daily-scenario", playerId],
    queryFn: () => api.getDailyScenario(playerId),
    staleTime: 60000,
  });
}

export function usePreBattle(playerId?: string, scenarioId?: string, mode = "daily") {
  return useMutation({
    mutationFn: () => api.startPreBattle(playerId || "demo", scenarioId || "fomo-trap-042", mode),
    onError: () => toast.error("Failed to start battle"),
  });
}

export function useBattleDecision() {
  return useMutation({
    mutationFn: ({ sessionId, optionId }: { sessionId: string; optionId: string }) =>
      api.submitDecision(sessionId, optionId),
    onError: () => toast.error("Decision submission failed"),
  });
}

export function useTriggerTwist() {
  return useMutation({
    mutationFn: (sessionId: string) => api.triggerTwist(sessionId),
  });
}

// ── LEADERBOARD ──
export function useLeaderboard(limit = 50) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: () => api.getLeaderboard(limit),
    staleTime: 30000,
  });
}

export function usePlayerRank(playerId?: string) {
  return useQuery({
    queryKey: ["player-rank", playerId],
    queryFn: () => api.getRankPosition(playerId || "demo"),
    enabled: !!playerId,
  });
}

// ── AI / OVERSEER ──
export function useAIScan(enabled = true) {
  return useQuery({
    queryKey: ["ai-scan"],
    queryFn: () => api.runAIScan({}),
    staleTime: 120000,
    enabled,
  });
}

export function useAIHealth() {
  return useQuery({
    queryKey: ["ai-health"],
    queryFn: () => api.getAIHealth(),
    staleTime: 60000,
  });
}
