// ============================================================
// SIGNAL ARENA — BATTLE API CLIENT
// Connects frontend to real battle engine on backend
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || '';

interface BattleCreateResponse {
  battleId: string;
  phase: string;
  scenario: {
    entityId: string;
    entityName: string;
    entityNameRu: string;
    archetype: string;
    discipline: string;
    threatLevel: string;
    corruption: number;
    glyph: string;
    level: number;
    asset: string;
    briefing: string;
    timeLimit: number;
    apBudget: number;
    marketCondition: { id: string; name: string; modifier: number };
    difficultyAxes: Record<string, number>;
  };
  options: Array<{ id: string; label: string }>;
  dataSources: Array<{ id: string; name: string; cost: number; revealed: boolean }>;
}

interface BattleResult {
  battleId: string;
  outcome: 'win' | 'loss' | 'draw';
  xpGained: number;
  sigGained: number;
  skillDeltas: Record<string, number>;
  newStreak: number;
  levelUp: boolean;
  rankUp: boolean;
  analysis: {
    layer1: string;
    layer2: string;
    layer3: string;
    icon: string;
  };
  timeSpent: number;
  sourcesUsed: string[];
  entityLevel: number;
  correctOptionId: string;
  playerOptionId: string;
}

interface SourceOpenResponse {
  apRemaining: number;
  openedSources: string[];
  fact: string | null;
  sourceId: string;
}

interface PlayerStats {
  xp: number;
  rankIndex: number;
  streak: number;
  longestStreak: number;
  battles: number;
  wins: number;
  sigBalance: number;
  skills: Record<string, number>;
  entityHistory: Record<string, { encounters: number; wins: number; level: number; status: string }>;
}

// ── API CALLS ──

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  
  return res.json();
}

export const battleApi = {
  // Create a new battle
  async create(playerId: string, mode: string = 'training', rankIndex: number = 0): Promise<BattleCreateResponse> {
    return apiCall('/api/battle/create', {
      method: 'POST',
      body: JSON.stringify({ playerId, mode, rankIndex }),
    });
  },

  // Start battle (idle → prebattle)
  async start(battleId: string): Promise<{ battleId: string; phase: string }> {
    return apiCall(`/api/battle/${battleId}/start`, { method: 'POST' });
  },

  // Go to battle (prebattle → battle)
  async fight(battleId: string): Promise<{ battleId: string; phase: string; timeLeft: number; apRemaining: number }> {
    return apiCall(`/api/battle/${battleId}/fight`, { method: 'POST' });
  },

  // Open a data source
  async openSource(battleId: string, sourceId: string): Promise<SourceOpenResponse> {
    return apiCall(`/api/battle/${battleId}/source`, {
      method: 'POST',
      body: JSON.stringify({ sourceId }),
    });
  },

  // Submit decision
  async decide(battleId: string, optionId: string): Promise<BattleResult> {
    return apiCall(`/api/battle/${battleId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  },

  // Get timer tick
  async tick(battleId: string): Promise<{ timeLeft: number; phase: string; twistEvent?: any }> {
    return apiCall(`/api/battle/${battleId}/tick`);
  },

  // Get battle state
  async getState(battleId: string): Promise<any> {
    return apiCall(`/api/battle/${battleId}`);
  },

  // Get player stats
  async getPlayerStats(playerId: string): Promise<PlayerStats> {
    return apiCall(`/api/player/${playerId}/stats`);
  },

  // Health check
  async health(): Promise<{ status: string; engine: string }> {
    return apiCall('/api/battle/health');
  },
};

// ── OFFLINE FALLBACK ──
// If backend is unavailable, use local battle logic
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const health = await battleApi.health();
    return health.status === 'ok';
  } catch {
    return false;
  }
}
