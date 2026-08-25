import type { MarketEntity } from "../../lib/data";
import { ARCHETYPES } from "../../lib/data";

const IMG_MAP: Record<string, string> = {
  "fomo-wraith": "/images/entity-fomo-wraith.jpg",
  "fake-breakout-phantom": "/images/entity-fake-breakout-phantom.jpg",
  "liquidity-hydra": "/images/entity-liquidity-hydra.jpg",
  "honeypot-mimic": "/images/entity-honeypot-mimic.jpg",
  "leverage-goblin": "/images/entity-leverage-goblin.jpg",
  "headline-titan": "/images/entity-headline-titan.jpg",
  "rug-pull-phantom": "/images/entity-rug-pull-phantom.jpg",
  "whale-syndicate": "/images/entity-whale-syndicate.jpg",
  "hubris-dragon": "/images/entity-hubris-dragon.jpg",
  "narrative-siren": "/images/entity-narrative-siren.jpg",
};

export function EntityPortrait({ entity, size = 160 }: { entity: MarketEntity | any; size?: number }) {
  const arch = ARCHETYPES.find((a) => a.id === entity.archetype);
  const img = IMG_MAP[entity.id];
  if (img) return <div className="flex shrink-0 overflow-hidden rounded-2xl border-2" style={{ width: size * 0.8, height: size, borderColor: `${arch?.color || "#666"}66` }}><img src={img} alt={entity.name} className="w-full h-full object-cover" loading="lazy" /></div>;
  return <div className="flex shrink-0 items-center justify-center rounded-2xl" style={{ width: size * 0.8, height: size, background: `radial-gradient(circle at 50% 35%, ${arch?.color || "#666"}55, rgba(5,7,15,0.9))`, border: `2px solid ${arch?.color || "#666"}66` }}><span className="text-6xl" style={{ filter: `drop-shadow(0 0 12px ${arch?.color || "#666"})` }}>{entity.glyph || "⚠️"}</span></div>;
}
export { IMG_MAP };
