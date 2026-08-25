// ============================================================
// OPENROUTER API CLIENT — AI Content Generation
// Used by Admin panel to generate scenarios via AI
// ============================================================
import { CONFIG } from "../config/index.js";

export class OpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey || CONFIG.OPENROUTER.API_KEY;
    this.endpoint = CONFIG.OPENROUTER.ENDPOINT;
    this.defaultModel = CONFIG.OPENROUTER.DEFAULT_MODEL;
    this.maxTokens = CONFIG.OPENROUTER.MAX_TOKENS;
    this.temperature = CONFIG.OPENROUTER.TEMPERATURE;
  }

  async generateScenarios({ entity, level, count }) {
    const prompt = this.buildPrompt(entity, level, count);
    const response = await this.call(prompt);
    return this.parseResponse(response, entity);
  }

  buildPrompt(entity, level, count) {
    return `You are a crypto trading scenario designer for Signal Arena.
Create ${count} scenarios for "${entity.nameRu}" at levels ${level}-${level + (count - 1) * 5}.
Entity: ${entity.description}. Mistakes: ${entity.expectedMistakes.join(", ")}.
Each scenario: 4 options (1 best, 1 good, 1 risky, 1 bad).
Use 3-layer commentary: Layer 1 (factual), Layer 2 (dry wit 5-12 words), Layer 3 (analysis).
Obfuscate historical data. Output JSON array.`;
  }

  async call(prompt) {
    if (!this.apiKey) {
      console.log("  No OpenRouter key — returning mock");
      return null;
    }
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.defaultModel, messages: [{ role: "user", content: prompt }], max_tokens: this.maxTokens, temperature: this.temperature }),
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch { return null; }
  }

  parseResponse(response, entity) {
    if (!response) return [];
    try { const parsed = JSON.parse(response); return Array.isArray(parsed) ? parsed : (parsed.scenarios || []); }
    catch { return []; }
  }
}

export function generateScenariosExpert(entity, level, count) {
  const scenarios = [];
  for (let i = 0; i < count; i++) {
    const lv = level + i * 5;
    scenarios.push({
      id: `${entity.id}-lvl${lv}-${Date.now()}-${i}`,
      entityId: entity.id, level: lv, asset: "BTC/USDT",
      briefing: `[EXPERT·Lv.${lv}] ${entity.name}. ${entity.manifestDesc?.slice(0, 80) || ""}`,
      options: [
        { id: "A", label: "Correct: discipline + analysis", correct: true, layer1: "Correct", layer2: "Analysis confirmed.", layer3: "Right." },
        { id: "B", label: `Trap: ${entity.expectedMistakes?.[0] || "impulse"}`, correct: false, layer1: "Error", layer2: "Predictable.", layer3: "Fell for trap." },
        { id: "C", label: `Trap: ${entity.expectedMistakes?.[1] || "emotion"}`, correct: false, layer1: "Error", layer2: "Emotion ruled.", layer3: "Emotional." },
        { id: "D", label: "Random action", correct: false, layer1: "Random", layer2: "Not strategy.", layer3: "No analysis." },
      ],
      generationType: "expert",
    });
  }
  return scenarios;
}
