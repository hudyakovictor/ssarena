import { motion } from "framer-motion";

export function LoadingSkeleton({ type = "card", count = 3 }: { type?: "card" | "list" | "detail" | "battle"; count?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--edge)] bg-[var(--night)] p-5">
          {type === "card" && (
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-white/[0.04]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded-lg bg-white/[0.04]" />
                <div className="h-3 w-48 rounded-lg bg-white/[0.03]" />
              </div>
            </div>
          )}
          {type === "list" && (
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-white/[0.04]" />
              <div className="h-4 flex-1 rounded-lg bg-white/[0.04]" />
              <div className="h-3 w-16 rounded-lg bg-white/[0.03]" />
            </div>
          )}
          {type === "detail" && (
            <div className="space-y-3">
              <div className="h-32 w-32 rounded-2xl bg-white/[0.04] mx-auto" />
              <div className="h-6 w-48 rounded-lg bg-white/[0.04] mx-auto" />
              <div className="h-4 w-64 rounded-lg bg-white/[0.03] mx-auto" />
              {[1,2,3].map(j => <div key={j} className="h-3 w-full rounded-lg bg-white/[0.02]" />)}
            </div>
          )}
          {type === "battle" && (
            <div className="space-y-3">
              <div className="h-60 rounded-xl bg-white/[0.03]" />
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map(j => <div key={j} className="h-16 rounded-xl bg-white/[0.03]" />)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon = "📭", title = "Пока ничего нет", desc, action }: { icon?: string; title?: string; desc?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="panel p-10 text-center">
      <span className="text-5xl block mb-4 opacity-40">{icon}</span>
      <p className="font-heading text-lg font-bold text-[var(--inkSoft)]">{title}</p>
      {desc && <p className="text-sm text-[var(--inkDim)] mt-1">{desc}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-4 text-sm">{action.label}</button>
      )}
    </motion.div>
  );
}

export function ErrorRetry({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="panel p-8 text-center">
      <span className="text-4xl block mb-3">⚠️</span>
      <p className="font-heading text-lg font-bold text-[var(--short)]">Что-то пошло не так</p>
      <p className="text-sm text-[var(--inkSoft)] mt-1 font-mono">{message || "Попробуйте обновить страницу"}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4 text-sm">Повторить</button>
      )}
    </motion.div>
  );
}
