import { useEffect, useRef, useState } from "react";

/**
 * TrainingPanorama — один 360° рендер, 80 сюжетов как оверлеи.
 * Геометрия 1:1 — никакого "разные локации", только начинка меняется.
 * Встраивается в Academy / Battle / Bestiary как <TrainingPanorama mode="learn|exam" onProgress={} />
 * Standalone демо: art/panoramas/SAREN-360-TRAINING-INTERFACE.html (1 файл, 0 deps)
 */

export type PanoramaMode = "learn" | "exam";

type Egg = { id: number; arch: string; title: string; desc: string; disc: string; lon: number; lat: number; l1: string; l2: string; l3: string };

const EGGS: Egg[] = [
  { id: 1, arch: "PHANTOM", title: "Fake Breakout Phantom", desc: "Ложный пробой без объёма", disc: "ta", lon: -85, lat: 8, l1: "✗ Fake Breakout", l2: "Пробой без объёма — не пробой", l3: "Объём не подтвердил. Multi-TF ниже. Вход — даришь ликвидность." },
  { id: 2, arch: "PHANTOM", title: "Rug Pull Phantom", desc: "Вытащил ликвидность 2 мин назад", disc: "security", lon: -75, lat: 10, l1: "✗ Liquidity gone", l2: "Аудит не покрыл proxy", l3: "Проверяй lock + proxy + mint." },
  { id: 3, arch: "WRAITH", title: "FOMO Wraith", desc: "Кричит BUY на вершине", disc: "psychology", lon: -65, lat: 12, l1: "✗ Late Entry", l2: "Соцсети 97% быков — ты последний", l3: "Funding +0.09% — перегрев. Жди ретест." },
  { id: 4, arch: "WRAITH", title: "Loss Aversion Wraith", desc: "Держит −40% до −85%", disc: "psychology", lon: -55, lat: 6, l1: "✗ Hold to zero", l2: "Маленький убыток стал катастрофой", l3: "Стоп на инвалидации, не на надежде." },
  { id: 5, arch: "WRAITH", title: "Revenge Wraith", desc: "Тильт после стопа", disc: "psychology", lon: -45, lat: -4, l1: "✗ Revenge", l2: "Хочешь вернуть — теряешь вдвойне", l3: "Пауза 10 мин, чек-лист." },
  { id: 6, arch: "TITAN", title: "Headline Titan", desc: "Заголовок рушит", disc: "fundamental", lon: -35, lat: 14, l1: "⚠ News shock", l2: "Первая реакция — часто ошибка", l3: "Проверяй on-chain, не заголовок." },
  { id: 7, arch: "TITAN", title: "Unlock Titan", desc: "Календарь TODAY", disc: "fundamental", lon: -25, lat: 4, l1: "⚠ Unlock", l2: "Дата видна с запуска", l3: "$2.3B анлок — все видели, никто не верил." },
  { id: 8, arch: "HYDRA", title: "Liquidity Hydra", desc: "5 голов-стопов", disc: "derivatives", lon: -15, lat: -6, l1: "✗ Stop widened", l2: "Сдвинул — Гидра съела дальше", l3: "Стоп на структуре, не на жалости." },
  { id: 9, arch: "CULT", title: "Indicator Cult", desc: "14 мониторов", disc: "ta", lon: -5, lat: 12, l1: "⚠ Overload", l2: "Ещё индикатор — не яснее", l3: "Тренд + объём > 14 линий." },
  { id: 10, arch: "CULT", title: "Confirmation Cult", desc: "2 свечи BULL/BEAR", disc: "psychology", lon: 5, lat: 8, l1: "⚠ Echo", l2: "Видишь то, что хочешь", l3: "Ищи опровержение тезиса." },
  // ... до 80 (сокращено для примера — в демо полный список 80)
];

export function TrainingPanorama({ mode = "learn", onProgress }: { mode?: PanoramaMode; onProgress?: (done: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<Egg | null>(null);

  useEffect(() => { onProgress?.(found.size); }, [found, onProgress]);

  // WebGL equirect setup — один base64, геометрия фиксирована
  // (упрощено: в реальном файле — шейдер mix, здесь — canvas image + drag)
  return (
    <div className="relative w-full h-[52vh] min-h-[380px] bg-black overflow-hidden rounded-2xl border border-white/10">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab" />
      {/* хотспоты — абсолютно поверх канваса, lon/lat → x/y */}
      <div className="absolute inset-0 pointer-events-none">
        {EGGS.slice(0, 80).map((e) => (
          <button
            key={e.id}
            onClick={() => { setFound((s) => new Set(s).add(e.id)); setActive(e); }}
            className={`absolute pointer-events-auto -translate-x-1/2 -translate-y-full rounded-xl border px-2.5 py-1.5 text-[11px] leading-tight bg-[#05070f]/90 backdrop-blur ${found.has(e.id) ? "opacity-40 border-cyan-400" : "border-white/20 hover:border-amber-300"}`}
            style={{ left: `${50 + e.lon * 0.35}%`, top: `${50 - e.lat * 1.1}%` }}
          >
            <b className="text-amber-300">#{String(e.id).padStart(2, "0")}</b> {e.title}
            <div className="text-white/70 text-[10px]">{mode === "exam" && !found.has(e.id) ? "???" : e.desc}</div>
          </button>
        ))}
      </div>
      {active && (
        <div className="absolute left-3 right-3 bottom-3 bg-[#05070f]/95 border border-white/15 rounded-xl p-3 backdrop-blur">
          <div className="text-[10px] tracking-widest text-cyan-400">{active.arch} · {active.disc}</div>
          <div className="text-sm font-bold">{active.title}</div>
          <div className="text-xs mt-1"><b>{active.l1}</b> — {active.l2}</div>
          <div className="text-xs text-white/70 mt-1">{active.l3}</div>
          <button onClick={() => setActive(null)} className="mt-2 text-xs px-3 py-1 rounded-full bg-white text-black font-bold">Закрыть</button>
        </div>
      )}
      <div className="absolute top-3 left-3 text-[10px] tracking-widest bg-white text-black px-2 py-1 rounded-full font-bold">{mode === "learn" ? "LEARN — все 80 видны" : "EXAM — найди 80" } · {found.size}/80</div>
    </div>
  );
}
