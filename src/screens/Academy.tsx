import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Lock, CheckCircle2, Trophy, Filter, Search, AlertTriangle } from "lucide-react";
import type { Screen } from "../App";
import { DISCIPLINES, C, MOCK_PLAYER } from "../lib/data";
import type { Discipline } from "../lib/data";
import { useT } from "../i18n";
import { getState } from "../lib/gameState";
import { loadErrorLessons, type ErrorLesson } from "../hooks/usePlayerProfile";
import { LoadingSkeleton, EmptyState, ErrorRetry } from "../components/LoadingSkeleton";
import toast from "react-hot-toast";

const NODES = [
  { id:1,name:"Свечи и их анатомия",disc:"ta" as Discipline,topic:"Candles",unlocked:true,done:true,xp:80,entity:"meme-mirage"},
  { id:2,name:"Тренды и структура рынка",disc:"ta" as Discipline,topic:"Structure",unlocked:true,done:true,xp:100,entity:"fake-breakout-phantom"},
  { id:3,name:"Уровни поддержки / сопротивления",disc:"ta" as Discipline,topic:"Levels",unlocked:true,done:false,xp:90,entity:"fake-breakout-phantom"},
  { id:4,name:"Объёмы: ключ к подтверждению",disc:"ta" as Discipline,topic:"Volume",unlocked:true,done:false,xp:120,entity:"fake-breakout-phantom"},
  { id:5,name:"Стоп-лосс и инвалидация",disc:"derivatives" as Discipline,topic:"Stop-Loss",unlocked:true,done:false,xp:100,entity:"loss-aversion-wraith"},
  { id:6,name:"Risk/Reward и Position Sizing",disc:"derivatives" as Discipline,topic:"Sizing",unlocked:true,done:false,xp:110,entity:"leverage-goblin"},
  { id:7,name:"FOMO: распознать и защититься",disc:"psychology" as Discipline,topic:"FOMO",unlocked:true,done:false,xp:130,entity:"fomo-wraith"},
  { id:8,name:"Когнитивные искажения трейдера",disc:"psychology" as Discipline,topic:"Bias",unlocked:true,done:false,xp:150,entity:"confirmation-cult"},
  { id:9,name:"Ончейн-метрики: резервы и потоки",disc:"fundamental" as Discipline,topic:"Onchain",unlocked:false,done:false,xp:160,entity:"whale-syndicate"},
  { id:10,name:"Токеномика: анлоки и эмиссия",disc:"fundamental" as Discipline,topic:"Tokenomics",unlocked:false,done:false,xp:140,entity:"unlock-titan"},
  { id:11,name:"Аудит смарт-контрактов: основы",disc:"security" as Discipline,topic:"Audit",unlocked:false,done:false,xp:180,entity:"rug-pull-phantom"},
  { id:12,name:"Honeypot и Rug Pull: как не попасть",disc:"security" as Discipline,topic:"Honeypot",unlocked:false,done:false,xp:200,entity:"honeypot-mimic"},
  { id:13,name:"FTX, LUNA, Hamster: уроки истории",disc:"security" as Discipline,topic:"History",unlocked:false,done:false,xp:250,entity:"rug-pull-phantom"},
];

const FILTERS: { id: "all"|Discipline; label: string; color: string; glyph: string }[] = [
  {id:"all",label:"Все",color:C.ink,glyph:"📚"},{id:"ta",label:"TA",color:C.signal,glyph:"📊"},
  {id:"derivatives",label:"Risk",color:C.gold,glyph:"⚖️"},{id:"psychology",label:"Psych",color:C.short,glyph:"🧠"},
  {id:"fundamental",label:"Fund",color:C.blue,glyph:"🌐"},{id:"security",label:"Security",color:C.grape,glyph:"🛡️"},
];

// Block 2.3 — server error_id → the academy node that teaches the fix.
// (error ids mirror server/src/lib/progress.js ERROR_LESSON keys)
const ERROR_TO_NODE: Record<string, { nodeId: number; disc: Discipline }> = {
  fomo_entry:           { nodeId: 7,  disc: "psychology" },
  overtrading:          { nodeId: 8,  disc: "psychology" },
  generic:              { nodeId: 8,  disc: "psychology" },
  overleverage:         { nodeId: 6,  disc: "derivatives" },
  leverage_overreach:   { nodeId: 6,  disc: "derivatives" },
  no_position_size:     { nodeId: 6,  disc: "derivatives" },
  no_stop:              { nodeId: 5,  disc: "derivatives" },
  stop_hunt:            { nodeId: 5,  disc: "derivatives" },
  liquidation_cascade:  { nodeId: 5,  disc: "derivatives" },
  fake_breakout:        { nodeId: 3,  disc: "ta" },
  ignoring_funding:     { nodeId: 4,  disc: "ta" },
  thin_liquidity:       { nodeId: 4,  disc: "ta" },
  news_chasing:         { nodeId: 9,  disc: "fundamental" },
  rug_entry:            { nodeId: 11, disc: "security" },
  honeypot:             { nodeId: 12, disc: "security" },
};

export function Academy({ player, setScreen }: { player: typeof MOCK_PLAYER; setScreen: (s: Screen) => void }) {
  const { t } = useT();
  const [filter, setFilter] = useState<"all"|Discipline>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const timer = setTimeout(() => setLoading(false), 500); return () => clearTimeout(timer); }, []);

  const filtered = NODES.filter((n) => {
    if (filter !== "all" && n.disc !== filter) return false;
    if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const done = NODES.filter((n) => n.done).length;
  const total = NODES.length;

  // Block 2.3 — recommended lessons from the player's real error journal
  const errorLessons = loadErrorLessons();
  const recommendedNodes = new Set(
    errorLessons.map((e) => ERROR_TO_NODE[e.error]?.nodeId).filter((n): n is number => typeof n === "number")
  );
  const totalErrorCount = errorLessons.reduce((a, e) => a + (e.count || 0), 0);

  if (loading) return <LoadingSkeleton type="list" count={6} />;
  if (error) return <ErrorRetry message={error} onRetry={() => { setError(null); setLoading(true); setTimeout(() => setLoading(false), 500); }} />;

  const handleNode = (node: typeof NODES[0]) => {
    if (!node.unlocked) { toast("Этот урок откроется позже", { icon: "🔒" }); return; }
    if (node.done) { toast("Ты уже прошёл этот урок", { icon: "✅" }); return; }
    setScreen("battle");
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wide">{t('common.menu_academy')}</h1>
          <p className="mt-1 text-sm text-[var(--inkSoft)]">{t('common.tagline')} · {done}/{total} пройдено</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--inkDim)]" />
          <input className="w-48 rounded-xl border border-[var(--edge)] bg-white/[0.02] py-2 pl-9 pr-3 font-mono text-xs text-[var(--ink)] placeholder-[var(--inkDim)] outline-none"
            placeholder="Поиск урока..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`pill ${filter===f.id?"":"hover:scale-105"}`}
            style={filter===f.id?{background:`${f.color}1a`,color:f.color,border:`1px solid ${f.color}44`}:{background:"transparent",color:C.inkDim,border:`1px solid var(--edge)`}}>
            {f.glyph} {f.label}</button>
        ))}
      </div>

      <div className="panel p-4">
        <div className="flex justify-between mb-2">
          <span className="font-mono text-[10px] text-[var(--inkDim)]">Прогресс обучения</span>
          <span className="font-mono text-[10px] text-[var(--signal)]">{Math.round(done/total*100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--signal)] via-[var(--grape)] to-[var(--gold)]" style={{width:`${Math.round(done/total*100)}%`}}/>
        </div>
      </div>

      {errorLessons.length > 0 && (
        <div className="panel p-4 border-[var(--short)]/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-[var(--short)]" /> 🎯 Урок за ошибку
            </h2>
            <span className="font-mono text-[10px] text-[var(--inkDim)]">{errorLessons.length} ошибок подряд · {totalErrorCount} всего</span>
          </div>
          <p className="text-xs text-[var(--inkSoft)] mb-3">
            В бою ты повторяешь эти ошибки — вот уроки, которые их лечат:
          </p>
          <div className="flex flex-wrap gap-2">
            {errorLessons.slice(0, 6).map((el, i) => {
              const map = ERROR_TO_NODE[el.error];
              const node = NODES.find((n) => n.id === map?.nodeId);
              const disc = node ? FILTERS.find((f) => f.id === node.disc) : undefined;
              return (
                <button key={`${el.error}-${i}`}
                  onClick={() => { if (node) handleNode(node); }}
                  className="flex items-center gap-2 rounded-lg border border-[var(--short)]/30 bg-[var(--short)]/[0.04] pl-2.5 pr-3 py-2 text-left hover:scale-[1.02] transition-all"
                  title={`Открыть урок: ${node?.name ?? ""}`}>
                  <span className="font-mono text-[10px] font-bold text-[var(--short)] min-w-[2ch] text-center">×{el.count || 1}</span>
                  <span className="text-xs font-semibold text-[var(--ink)]">{el.titleRu}</span>
                  {disc && <span className="font-mono text-[9px]" style={{color: disc.color}}>{disc.glyph}</span>}
                  <ChevronRight size={12} className="text-[var(--inkDim)]" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Ничего не найдено" desc="Попробуй изменить фильтр или поисковый запрос" action={{ label: "Сбросить фильтры", onClick: () => { setFilter("all"); setSearch(""); } }} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((node) => {
            const disc = FILTERS.find((f) => f.id === node.disc)!;
            return (
              <motion.div key={node.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => handleNode(node)}
                className={`panel flex items-center gap-4 p-4 transition-all ${node.unlocked ? "cursor-pointer hover:scale-[1.01] hover:border-[var(--signal)]/20" : "opacity-50 cursor-not-allowed"} ${recommendedNodes.has(node.id) ? "border-[var(--short)]/40" : ""}`}
                role="button" tabIndex={0} aria-label={`${node.name}, ${node.unlocked ? 'доступен' : 'заблокирован'}, ${node.done ? 'пройден' : 'не пройден'}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNode(node); }}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 ${node.done?"border-[var(--long)]/50 bg-[var(--long)]/10":node.unlocked?"border-[var(--signal)]/50 bg-[var(--signal)]/10":"border-[var(--edge)] bg-white/[0.02]"}`}>
                  {node.done?<CheckCircle2 size={20} className="text-[var(--long)]"/>:node.unlocked?<BookOpen size={20} className="text-[var(--signal)]"/>:<Lock size={16} className="text-[var(--inkDim)]"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-heading text-sm font-bold ${node.unlocked?"":"text-[var(--inkDim)]"}`}>{node.name}</p>
                    <span className="pill" style={{background:`${disc.color}1a`,color:disc.color,border:`1px solid ${disc.color}44`}}>{disc.glyph} {node.topic}</span>
                    <span className="font-mono text-[10px] text-[var(--inkDim)]">{node.xp} XP</span>
                  </div>
                  {node.done && <p className="mt-1 font-mono text-[9px] text-[var(--long)]">✅ Пройдено</p>}
                  {node.unlocked && !node.done && <p className="mt-1 font-mono text-[9px] text-[var(--inkDim)]">Готово к прохождению</p>}
                  {!node.unlocked && <p className="mt-1 font-mono text-[9px] text-[var(--inkDim)]">🔒 Откроется позже</p>}
                  {node.unlocked && <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-[var(--signal)] to-[var(--grape)]" style={{width:node.done?"100%":"0%"}}/></div>}
                </div>
                {node.unlocked && <ChevronRight size={18} className="text-[var(--inkDim)] shrink-0"/>}
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="panel p-5">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><Trophy size={14} className="text-[var(--gold)]"/> 📖 Реальные истории рынка</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[{year:"2022",title:"FTX Collapse",desc:"Как биржа на $32B рухнула за 48 часов.",entity:"Insider Syndicate"},{year:"2022",title:"LUNA Death Spiral",desc:"Алгоритмический стейблкоин без обеспечения.",entity:"Loss Aversion Wraith"},{year:"2021",title:"SQUID Rug Pull",desc:"+45000%, но кнопка SELL — декоративная.",entity:"Honeypot Mimic"},{year:"2024",title:"Hamster Kombat",desc:"Миллионы тапали. Что с токеномикой?",entity:"Narrative Siren"}].map((s)=>(
            <div key={s.title} className="rounded-xl border border-[var(--edge)] bg-black/20 p-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)]/10 text-[var(--gold)] font-display text-sm font-bold">{s.year}</div>
              <div><p className="font-heading text-sm font-bold">{s.title}</p><p className="text-xs text-[var(--inkSoft)] mt-0.5">{s.desc}</p><p className="pill mt-1.5" style={{background:`${C.short}1a`,color:C.short,border:`1px solid ${C.short}44`}}>{s.entity}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
