import { useState, useRef, useCallback, useEffect } from "react";
import { MARKET_ENTITIES, MOCK_PLAYER, ARCHETYPES } from "../lib/data";
import { generateMockCandles } from "../components/TradingChart";
import { ACTIVE_PROFILE } from "../lib/marketProfile";
import { fetchCandles } from "./useBattleSession";

const P = ACTIVE_PROFILE;

// Optional server scenario shape (block 1.2/1.5)
export interface ServerOption {
  id: string;
  label: string;
  layer1?: string;
  layer2?: string;
  layer3?: string;
}
export interface ServerScenarioInput {
  entityId: string;
  briefing: string;
  asset: string;
  options: ServerOption[];
}
export interface ServerResult {
  score: number;
  correct: boolean;
  layer1?: string;
  layer2?: string;
  layer3?: string;
  battleId?: string;
}

export type BattlePhase = "idle" | "prebattle" | "battle" | "twist" | "result";
export type BattleMode = "daily" | "ghost" | "live" | "training";

interface TwistEvent { id: string; text: string; icon: string; type: string; }

const TWISTS: TwistEvent[] = [
  { id: "tw1", text: "⚠ TWIST: Пробой оказался ложным. Объём резко упал.", icon: "👻", type: "fakeout" },
  { id: "tw2", text: "⚠ TWIST: Breaking News! Мажорная площадка объявила делистинг.", icon: "📰", type: "news" },
  { id: "tw3", text: "⚠ TWIST: Волатильность удвоилась. Стопы сметаются.", icon: "🌊", type: "volatility" },
  { id: "tw4", text: "⚠ TWIST: Кит вышел в рынок.", icon: "🐋", type: "whale" },
  { id: "tw5", text: "⚠ TWIST: Крупный игрок обновил позицию через хедж.", icon: "🔄", type: "security" },
  { id: "tw6", text: "⚠ TWIST: Fake news! Заголовок — фейк.", icon: "🤥", type: "fakenews" },
];

export function useBattle(
  playerId: string,
  playerRank: number,
  opts?: {
    serverScenario: ServerScenarioInput | null;
    onLocalFinish?: (r: { correct: boolean; score: number; timeLeft: number; attentionLeft: number }) => void;
  },
) {
  const [phase, setPhase] = useState<BattlePhase>("idle");
  const [mode, setMode] = useState<BattleMode>("daily");
  const [serverScenario, setSScenario] = useState<ServerScenarioInput | null>(null);
  const [openedSources, setOpenedSources] = useState<Set<string>>(new Set(["chart"]));
  const [timeLeft, setTimeLeft] = useState(45);
  const [attentionLeft, setAttentionLeft] = useState(MOCK_PLAYER.attention);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [serverResult, setServerResult] = useState<ServerResult | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [twistTriggered, setTwistTriggered] = useState(false);
  const [twistEvent, setTwistEvent] = useState<TwistEvent | null>(null);
  const [score, setScore] = useState(0);
  const [entityId, setEntityId] = useState("fomo-wraith");
  const [candles, setCandles] = useState<any[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scenarioRef = useRef<ServerScenarioInput | null>(null);
  scenarioRef.current = serverScenario;

  // Server scenario overrides the local one (block 1.2/1.5)
  useEffect(() => {
    if (opts?.serverScenario) {
      setSScenario(opts.serverScenario);
      if (MARKET_ENTITIES.some((e) => e.id === opts.serverScenario!.entityId)) {
        setEntityId(opts.serverScenario!.entityId);
      }
    }
  }, [opts?.serverScenario]);

  const effScenario = serverScenario;
  const localEntity = MARKET_ENTITIES.find((e) => e.id === effScenario?.entityId) || MARKET_ENTITIES.find((e) => e.id === "fomo-wraith")!;
  const entity = localEntity;
  const arch = ARCHETYPES.find((a) => a.id === entity.archetype)!;
  const entityLevel = Math.min(99, playerRank * 5 + entity.corruption / 10);

  // Live candles: server first, local fallback (block 1.2)
  useEffect(() => {
    let cancelled = false;
    const seed = effScenario ? (effScenario as any).id || effScenario.briefing : entity.id + entityLevel;
    fetchCandles(seed, 60).then((srv) => {
      if (cancelled) return;
      setCandles(srv && srv.length ? srv : generateMockCandles(60, "up"));
    });
    return () => { cancelled = true; };
  }, [effScenario, entity.id]);

  // Per-source facts: server briefing in chart slot, profile facts elsewhere.
  const sourceById: Record<string, { cost: number }> = {};
  for (const s of P.sources) sourceById[s.id] = s;

  const scenarioFacts: Record<string, string> = {};
  for (const s of P.sources) {
    scenarioFacts[s.id] = s.id === "chart"
      ? `${P.chartFact} ${effScenario ? effScenario.briefing : `Entity: ${entity.nameRu} Lv.${entityLevel}.`}`
      : s.fact;
  }

  // Options: server list (real content pack) OR local profile options
  const scenarioOptions: { id: string; short: string; label: string; correct: boolean; layer1: string; layer2: string; layer3: string }[] =
    effScenario && effScenario.options.length
      ? effScenario.options.map((o) => {
          const m = o.id.match(/_opt_([A-Z])/i);
          return {
            id: o.id,
            short: m ? m[1].toUpperCase() : o.id.slice(-2).toUpperCase(),
            label: o.label,
            correct: true, // resolved against server on submit (anti-cheat: client never knows)
            layer1: o.layer1 || "", layer2: o.layer2 || "", layer3: o.layer3 || "",
          };
        })
      : P.options.map((o) => ({ ...o, short: o.id.toUpperCase().slice(0, 2) }));

  // Keep a local option lookup for the result screen
  const optionLookup = new Map(scenarioOptions.map((o) => [o.id, o]));

  const option = selectedOption
    ? (optionLookup.get(selectedOption) || { id: selectedOption, short: "?", label: "", correct: true, layer1: "", layer2: "", layer3: "" })
    : null;
  const isCorrect = serverResult ? serverResult.correct : option?.correct ?? true;

  // Timer
  useEffect(() => {
    if ((phase === "battle" || phase === "twist") && timeLeft > 0 && !showResult) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => { if (t <= 1) { /* server will grade; local: treat as timeout loss */ return 0; } return t - 1; });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft, showResult]);

  const triggerTwist = useCallback(() => {
    if (currentRound >= 2 && !twistTriggered && Math.random() < 0.4) {
      const twist = TWISTS[Math.floor(Math.random() * TWISTS.length)];
      setTwistEvent(twist); setTwistTriggered(true);
      setPhase("twist"); setTimeLeft((t) => t + 10);
      return twist;
    }
    return null;
  }, [currentRound, twistTriggered]);

  const toggleSource = useCallback((id: string) => {
    if (showResult) return;
    const src = sourceById[id]; if (!src) return;
    setOpenedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setAttentionLeft((a) => Math.min(8, a + src.cost)); }
      else if (attentionLeft >= src.cost) { next.add(id); setAttentionLeft((a) => a - src.cost); }
      return next;
    });
  }, [showResult, attentionLeft]);

  const submitDecision = useCallback(async (optId: string, serverSubmit?: (optId: string) => Promise<ServerResult | null>) => {
    setSelectedOption(optId);
    setShowResult(true);
    if (timerRef.current) clearInterval(timerRef.current);
    let finalResult: ServerResult | null = null;
    if (serverSubmit) {
      finalResult = await serverSubmit(optId);
      if (finalResult) {
        setServerResult(finalResult);
        setScore(finalResult.score);
        // server's terminal voice wins over local template
        const localOpt = optionLookup.get(optId);
        if (finalResult.layer1) localOpt && (localOpt.layer1 = finalResult.layer1, localOpt.layer2 = finalResult.layer2 || localOpt.layer2, localOpt.layer3 = finalResult.layer3 || localOpt.layer3);
        return finalResult;
      }
    }
    // Local fallback scoring
    const opt = optionLookup.get(optId);
    if (opt?.correct) {
      const timeBonus = Math.round((timeLeft / 45) * 30);
      const apBonus = Math.round((attentionLeft / 8) * 20);
      setScore(50 + timeBonus + apBonus);
    } else { setScore(Math.round(Math.random() * 30)); }
    opts?.onLocalFinish?.({ correct: !!opt?.correct, score: opt?.correct ? 50 + Math.round((timeLeft / 45) * 30) : Math.round(Math.random() * 30), timeLeft, attentionLeft });
    return null;
  }, [timeLeft, attentionLeft]);

  const startBattle = useCallback((m: BattleMode = "daily", entId?: string) => {
    if (entId) setEntityId(entId);
    setSScenario(null);
    setServerResult(null);
    setMode(m); setPhase("prebattle");
    setOpenedSources(new Set(["chart"])); setTimeLeft(45);
    setAttentionLeft(MOCK_PLAYER.attention); setSelectedOption(null);
    setShowResult(false); setCurrentRound(1); setTwistTriggered(false);
    setTwistEvent(null); setScore(0);
  }, []);

  const goToBattle = useCallback(() => { setPhase("battle"); }, []);

  return {
    phase, mode, entity, arch, entityLevel, candles,
    profileAsset: P.asset, profileTickers: P.tickers,
    openedSources, attentionLeft, timeLeft,
    selectedOption, showResult, score, serverResult,
    currentRound, twistEvent, twistTriggered,
    scenarioFacts, scenarioOptions, option, isCorrect,
    toggleSource, submitDecision, startBattle, goToBattle,
    triggerTwist, setPhase, setMode,
  };
}
