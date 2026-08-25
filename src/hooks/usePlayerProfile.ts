import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { SKILLS, getState, setState } from "../lib/gameState";

// ============================================================
// SERVER PROFILE SYNC (block 2.4) — the server players-DB is the
// single source of truth for meta progress. We pull it and push it
// into local game state, so every screen (Profile, Collection,
// Bestiary, TopBar) shows REAL numbers while offline fallback stays.
// Also keeps the "lesson of the error" feed (error -> academy).
// ============================================================

const LESSONS_KEY = "sa_error_lessons_v1";
export interface ErrorLesson {
  error: string;
  lesson: string;
  titleRu: string;
  count: number;
  lastSeen: string;
}

export function loadErrorLessons(): ErrorLesson[] {
  try {
    const raw = localStorage.getItem(LESSONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted */ }
  return [];
}

export function saveErrorLessons(list: ErrorLesson[]) {
  try { localStorage.setItem(LESSONS_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

let _syncing = false;

/** Pull the server profile for a player and merge it into local state. */
export async function syncServerProfile(playerId: string): Promise<void> {
  if (!playerId || playerId.startsWith("local_") || _syncing) return;
  let data: any;
  try {
    data = await api.getPlayer(playerId);
  } catch {
    return; // offline — keep local state
  }
  if (!data || typeof data !== "object") return;

  _syncing = true;
  try {
    const prev = getState();

    // skills: base 10 for anything the server doesn't track yet
    const skills = { ...prev.skillValues };
    for (const s of SKILLS) {
      if (!(s.id in skills)) skills[s.id] = 10;
    }
    const srvSkills: any[] = Array.isArray(data.skills) ? data.skills : [];
    if (srvSkills.length) {
      for (const row of srvSkills) skills[row.skill_id] = Number(row.value) || 0;
    }

    // entities: merge server encounters over local defaults
    const entityHistory = { ...prev.entityHistory };
    const srvEnt: any[] = Array.isArray(data.entities) ? data.entities : [];
    for (const e of srvEnt) {
      entityHistory[e.entity_id] = {
        status: e.status,
        encounters: e.encounters || 0,
        wins: e.wins || 0,
        lastEncounter: e.last_encounter || null,
        bestTime: entityHistory[e.entity_id]?.bestTime ?? null,
        currentLevel: entityHistory[e.entity_id]?.currentLevel ?? 1,
      };
    }

    const cardsOwned: string[] = (Array.isArray(data.cards) ? data.cards : [])
      .map((c: any) => c.card_id).filter(Boolean);

    setState({
      id: playerId,
      name: data.display_name || prev.name,
      xp: typeof data.xp === "number" ? data.xp : prev.xp,
      rankIndex: typeof data.rank_index === "number" ? data.rank_index : prev.rankIndex,
      streak: data.streak || 0,
      longestStreak: data.longest_streak || 0,
      battles: data.total_battles || 0,
      wins: data.total_wins || 0,
      losses: Math.max(0, (data.total_battles || 0) - (data.total_wins || 0)),
      skillValues: skills,
      entityHistory,
      unlockedCards: cardsOwned,
      serverRating: data.rating,
      lastProfileSync: Date.now(),
    } as any);

    // error journal -> academy lesson feed (2.3)
    const srvErr: any[] = Array.isArray(data.errors) ? data.errors : [];
    if (srvErr.length) {
      saveErrorLessons(srvErr.map((e) => ({
        error: e.error_id,
        lesson: (e as any).lesson || "psy_general",
        titleRu: e.error_title || e.error_id,
        count: e.count || 1,
        lastSeen: e.last_seen || "",
      })));
    }
  } finally {
    _syncing = false;
  }
}

export function usePlayerProfile(playerId: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const loaded = useRef<Set<string>>(new Set());

  const refresh = useCallback(async (force = false) => {
    if (!playerId || playerId.startsWith("local_")) return;
    _syncing = true; // avoid racing the mount-time sync
    setLoading(true);
    try {
      const data = await api.getPlayer(playerId);
      setProfile(data);
      loaded.current.add(playerId);
      // re-sync numbers on top of whatever was pulled
      await syncServerProfileData(data);
    } catch {
      /* offline */
    } finally {
      _syncing = false;
      setLoading(false);
    }
  }, [playerId]);

  // mount-time one-shot sync per identity
  useEffect(() => {
    if (playerId && !playerId.startsWith("local_") && !loaded.current.has(playerId)) {
      loaded.current.add(playerId);
      syncServerProfile(playerId);
    }
  }, [playerId]);

  return { profile, loading, refresh };
}

async function syncServerProfileData(data: any) {
  // same merge as syncServerProfile, but with an already-fetched payload
  const prev = getState();
  const skills = { ...prev.skillValues };
  for (const s of SKILLS) if (!(s.id in skills)) skills[s.id] = 10;
  const srvSkills: any[] = Array.isArray(data?.skills) ? data.skills : [];
  if (srvSkills.length) for (const row of srvSkills) skills[row.skill_id] = Number(row.value) || 0;
  const entityHistory = { ...prev.entityHistory };
  const srvEnt: any[] = Array.isArray(data?.entities) ? data.entities : [];
  for (const e of srvEnt) {
    entityHistory[e.entity_id] = {
      status: e.status,
      encounters: e.encounters || 0,
      wins: e.wins || 0,
      lastEncounter: e.last_encounter || null,
      bestTime: entityHistory[e.entity_id]?.bestTime ?? null,
      currentLevel: entityHistory[e.entity_id]?.currentLevel ?? 1,
    };
  }
  setState({
    xp: typeof data?.xp === "number" ? data.xp : prev.xp,
    rankIndex: typeof data?.rank_index === "number" ? data.rank_index : prev.rankIndex,
    streak: data?.streak || 0,
    longestStreak: data?.longest_streak || 0,
    battles: data?.total_battles || 0,
    wins: data?.total_wins || 0,
    losses: Math.max(0, (data?.total_battles || 0) - (data?.total_wins || 0)),
    skillValues: skills,
    entityHistory,
    unlockedCards: (Array.isArray(data?.cards) ? data.cards : []).map((c: any) => c.card_id).filter(Boolean),
    serverRating: data?.rating,
    lastProfileSync: Date.now(),
  } as any);
}
