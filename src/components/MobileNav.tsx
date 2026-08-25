import { LayoutDashboard, BookOpen, Swords, Library, User } from "lucide-react";
import type { Screen } from "../App";

const NAV: { id: Screen; icon: React.ElementType; label: string }[] = [
  { id: "home", icon: LayoutDashboard, label: "Hub" },
  { id: "academy", icon: BookOpen, label: "Акад." },
  { id: "arena", icon: Swords, label: "Арена" },
  { id: "collection", icon: Library, label: "Кол." },
  { id: "profile", icon: User, label: "Проф." },
];

export function MobileNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--edge)] bg-[var(--abyss)]/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around px-1 py-2">
        {NAV.map((item) => {
          const isActive = screen === item.id;
          return (
            <button key={item.id} onClick={() => setScreen(item.id)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all ${isActive ? "text-[var(--signal)]" : "text-[var(--inkDim)]"}`}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="font-mono text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
              {isActive && <div className="mt-0.5 h-[3px] w-5 rounded-full bg-[var(--signal)]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
