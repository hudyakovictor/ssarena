import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export function NotFound({ setScreen }: { setScreen: (s: string) => void }) {
  return (
    <main className="flex items-center justify-center min-h-[60vh]" role="main" aria-label="404 page not found">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="panel p-10 text-center max-w-md">
        <span className="text-6xl block mb-4" aria-hidden="true">🔮</span>
        <h1 className="font-display text-5xl font-black text-[var(--signal)]">404</h1>
        <p className="font-heading text-lg font-bold mt-2 text-[var(--short)]">Position Not Found</p>
        <p className="text-sm text-[var(--inkSoft)] mt-2 leading-relaxed">
          "The chart doesn't offer this page. Chart never promised friendship either. Try another direction."
        </p>
        <button
          onClick={() => setScreen("home")}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setScreen("home"); }}
          className="btn-primary mt-6" aria-label="Back to Dashboard">
          <ArrowLeft size={14} aria-hidden="true" /> Back to Dashboard
        </button>
      </motion.div>
    </main>
  );
}
