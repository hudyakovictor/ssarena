import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { MARKET_ENTITIES, type MarketEntity } from "../lib/data";

// Block 1.6 — canonical 18-entity roster comes from the server content pack
// (/api/content/entities), which the admin can publish/unpublish. We overlay
// the rich local lore (psychology, counters, axes) so the bestiary stays deep,
// and fall back to the bundled 18 when the server is unreachable (offline play).
export function useEntities() {
  const [entities, setEntities] = useState<MarketEntity[]>(() => MARKET_ENTITIES);
  const [fromServer, setFromServer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows: any[] = await api.getContentEntities();
        if (cancelled) return;
        if (Array.isArray(rows) && rows.length) {
          const merged = rows.map((sr) => {
            const local = MARKET_ENTITIES.find((l) => l.id === sr.id);
            if (local) {
              return {
                ...local,
                name: sr.name || local.name,
                nameRu: sr.nameRu || local.nameRu,
                archetype: sr.archetype || local.archetype,
                discipline: sr.discipline || local.discipline,
                threatLevel: sr.threatLevel || local.threatLevel,
                corruption: sr.corruption ?? local.corruption,
                description: sr.description || local.description,
                loreSnippet: sr.lore || local.loreSnippet,
                glyph: sr.glyph || local.glyph,
              } as MarketEntity;
            }
            // Server-only entity (admin-added): minimal shape, no local lore.
            return {
              ...local,
              name: sr.name, nameRu: sr.nameRu || sr.name,
              archetype: sr.archetype, discipline: sr.discipline,
              threatLevel: sr.threatLevel, corruption: sr.corruption,
              description: sr.description, loreSnippet: sr.lore || sr.description,
              glyph: sr.glyph || "❓",
            } as MarketEntity;
          });
          setEntities(merged);
          setFromServer(true);
        }
      } catch {
        /* offline: keep bundled roster */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { entities, fromServer, loading };
}
