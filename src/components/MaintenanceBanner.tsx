import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Wrench, Clock, CheckCircle2, X } from "lucide-react";
import { C } from "../lib/data";

type MaintMode = "none" | "scheduled" | "emergency" | "simulation";

interface MaintState {
  active: boolean;
  mode: MaintMode;
  message: string;
  estimatedEnd: string | null;
  progress: number; // 0-100
}

// In production, this would come from an API endpoint /api/system/status
const MAINTENANCE_KEY = "sa_maintenance_state";

function getStoredState(): MaintState {
  try {
    const raw = localStorage.getItem(MAINTENANCE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { active: false, mode: "none", message: "", estimatedEnd: null, progress: 0 };
}

export function useMaintenance() {
  const [state, setState] = useState<MaintState>(getStoredState);

  const setMaintenance = (s: Partial<MaintState>) => {
    const next = { ...state, ...s };
    setState(next);
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(next));
  };

  const startScheduled = (message: string, estimatedEnd?: string) => {
    setMaintenance({ active: true, mode: "scheduled", message, estimatedEnd: estimatedEnd || null, progress: 0 });
  };

  const startEmergency = (message: string) => {
    setMaintenance({ active: true, mode: "emergency", message, estimatedEnd: null, progress: 0 });
  };

  const startSimulation = (message: string) => {
    setMaintenance({ active: true, mode: "simulation", message, estimatedEnd: null, progress: 0 });
  };

  const updateProgress = (progress: number) => {
    setMaintenance({ ...state, progress: Math.min(100, Math.max(0, progress)) });
  };

  const endMaintenance = () => {
    setMaintenance({ active: false, mode: "none", message: "", estimatedEnd: null, progress: 0 });
  };

  return { state, startScheduled, startEmergency, startSimulation, updateProgress, endMaintenance };
}

export function MaintenanceBanner({ state, onDismiss }: { state: MaintState; onDismiss?: () => void }) {
  if (!state.active) return null;

  const colors = {
    scheduled: { bg: `${C.gold}10`, border: C.gold, text: C.gold, icon: Clock },
    emergency: { bg: `${C.short}10`, border: C.short, text: C.short, icon: AlertTriangle },
    simulation: { bg: `${C.signal}10`, border: C.signal, text: C.signal, icon: Wrench },
  };
  const c = colors[state.mode] || colors.scheduled;
  const Icon = c.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ background: c.bg, borderColor: `${c.border}30` }}>
          <Icon size={16} style={{ color: c.text }} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[11px] font-bold" style={{ color: c.text }}>
              {state.mode === "emergency" ? "🚨 EMERGENCY" : state.mode === "scheduled" ? "🔧 MAINTENANCE" : "🧪 SIMULATION MODE"}
            </p>
            <p className="font-mono text-[10px] text-[var(--inkSoft)] truncate">{state.message}</p>
            {state.estimatedEnd && (
              <p className="font-mono text-[9px] text-[var(--inkDim)] mt-0.5">
                Ожидаемое завершение: {state.estimatedEnd}
              </p>
            )}
            {state.progress > 0 && (
              <div className="mt-1 h-1 w-48 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full" style={{ width: `${state.progress}%`, backgroundColor: c.text }} />
              </div>
            )}
          </div>
          {onDismiss && state.mode !== "emergency" && (
            <button onClick={onDismiss} className="text-[var(--inkDim)] hover:text-[var(--ink)] shrink-0">
              <X size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
