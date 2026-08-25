// ============================================================
// SIGNAL ARENA — ADMIN PANEL
// AI Co-Pilot Chat, Scenario Generator, Safety Controls
// Only loaded when VITE_ADMIN_ENABLED=true
// ============================================================
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, Sparkles, Plus, Save, Download, Trash2, Play, Database, 
  Globe, Key, Terminal, Code, RefreshCw, Send, Bot, Shield, ShieldOff, 
  HardDrive, AlertTriangle, Activity, Users, DollarSign, Zap, 
  ChevronDown, ChevronUp, X, FlaskConical, Timer, CheckCircle2 
} from "lucide-react";
import { MARKET_ENTITIES, ARCHETYPES, C } from "../lib/data";
import { ACTIVE_PROFILE } from "../lib/marketProfile";
import { api } from "../lib/api";

interface ChatMessage { 
  role: "user" | "agent" | "orchestrator" | "system"; 
  content: string; 
  agent?: string; 
  timestamp: string; 
  type?: string; 
}

interface AgentStatus {
  id: string; name: string; role: string; health: string; report: string; active: boolean;
}

export function Admin() {
  const [tab, setTab] = useState<"chat" | "generator" | "scenarios" | "pipeline" | "safety" | "simulation" | "b2b">("chat");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      role: "system", 
      content: "AI Co-Pilot ready. 5 agents monitoring the system. Ask a question or say 'summary' for overview.\n\nAvailable agents:\n• Retention Analyst - retention\n• Economy Controller - economy\n• LiveOps Commander - events\n• Content Verifier - scenarios\n• Security Sentinel - security", 
      timestamp: new Date().toISOString() 
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentsSummary, setAgentsSummary] = useState<AgentStatus[]>([]);
  const [safetyStatus, setSafetyStatus] = useState<any>({ globalHalted: false });
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [packInfo, setPackInfo] = useState<any>(null);
  const [selectedEntity, setSelectedEntity] = useState(MARKET_ENTITIES[0].id);
  const [level, setLevel] = useState(10);
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<string>("unknown");
  // ── Block 4.3: B2B stub panel ──
  const [b2bOrg, setB2bOrg] = useState("demo-academy");
  const [b2bTier, setB2bTier] = useState("academy");
  const [b2bKeys, setB2bKeys] = useState<any[]>([]);
  const [b2bEntity, setB2bEntity] = useState(MARKET_ENTITIES[0].id);
  const [b2bPlayerId, setB2bPlayerId] = useState("");
  const [b2bResult, setB2bResult] = useState<string | null>(null);
  const [b2bRunning, setB2bRunning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  const addChat = (msg: ChatMessage) => { 
    setChatMessages((prev) => [...prev, msg]); 
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); 
  };

  useEffect(() => {
    // Check server status
    fetch("/api/health").then(() => setServerStatus("connected")).catch(() => setServerStatus("offline"));
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    addChat({ role: "user", content: msg, timestamp: new Date().toISOString() });
    setSending(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error("Agent API error");
      const data = await res.json();

      if (data.type === "single_agent") {
        addChat({ role: "agent", content: data.response, agent: data.agent, timestamp: new Date().toISOString() });
      } else if (data.type === "orchestrator") {
        addChat({ role: "orchestrator", content: data.response, timestamp: new Date().toISOString() });
      }
    } catch (e: any) {
      addChat({ role: "system", content: `Error: ${e.message}. Is backend running?`, timestamp: new Date().toISOString() });
    }
    setSending(false);
  };

  const haltAll = async () => {
    try {
      await fetch("/api/agent/halt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "manual" }) });
      addChat({ role: "system", content: "ALL AI AGENTS HALTED. Use /resume to continue.", timestamp: new Date().toISOString() });
      setSafetyStatus({ globalHalted: true });
    } catch { /* offline */ }
  };

  const resumeAll = async () => {
    try {
      await fetch("/api/agent/resume", { method: "POST" });
      addChat({ role: "system", content: "All AI agents resumed.", timestamp: new Date().toISOString() });
      setSafetyStatus({ globalHalted: false });
    } catch { /* offline */ }
  };

  // ── Block 3: content pipeline (server-backed) ──
  const loadScenarios = async () => {
    setScenariosLoading(true);
    try {
      const d = await api.listScenarios();
      setScenarios(d.scenarios || []);
    } catch { setScenarios([]); addLog("Scenarios: server offline (local list empty)"); }
    setScenariosLoading(false);
  };

  const loadPack = async () => {
    try {
      const d = await api.getContentPack();
      setPackInfo({ items: d.items, version: d.version, signature: d.signature });
    } catch { setPackInfo(null); }
  };

  useEffect(() => { loadScenarios(); loadPack(); loadB2bKeys(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateScenarios = async () => {
    setGenerating(true);
    try {
      const d = await api.generateScenarios(selectedEntity, level, count);
      addLog(`Generated ${d.generated} scenarios from ${selectedEntity} (Lv.${level}) → verify & publish in Scenarios`);
      loadScenarios();
    } catch (e: any) {
      addLog(`Generate failed: ${e?.message || "server offline"}`);
    }
    setGenerating(false);
  };

  const publishScenario = async (id: string) => {
    try {
      const d = await api.publishScenario(id);
      addLog(`Published ${id} → signed pack v${d.packVersion} (sig ${d.signature.slice(0, 8)}…)`);
      await Promise.all([loadScenarios(), loadPack()]);
    } catch (e: any) { addLog(`Publish failed: ${e?.message}`); }
  };

  const verifyScenario = async (id: string) => {
    try {
      const d = await api.verifyScenario(id);
      addLog(`Verify ${id}: ${d.pass ? "PASS" : "FAIL"}${d.pass ? "" : " — " + (d.error || "issues found")}`);
    } catch (e: any) { addLog(`Verify failed: ${e?.message}`); }
  };

  const deleteScenario = async (id: string) => {
    try {
      await api.deleteScenario(id);
      addLog("Deleted scenario");
      loadScenarios();
    } catch (e: any) { addLog(`Delete failed: ${e?.message}`); }
  };

  // ── Block 4.3: B2B handlers ──
  const loadB2bKeys = async () => {
    try { setB2bKeys((await api.b2b.listKeys()).partners || []); } catch { setB2bKeys([]); }
  };
  const createB2bKey = async () => {
    try {
      await api.b2b.createKey(b2bOrg, b2bTier);
      addLog(`B2B key issued for ${b2bOrg} (${b2bTier})`);
      loadB2bKeys();
    } catch (e: any) { addLog(`B2B key failed: ${e?.message}`); }
  };
  const b2bTest = async (fn: (key?: string) => Promise<any>, label: string) => {
    setB2bRunning(true); setB2bResult(null);
    const key = b2bKeys[0]?.key;
    if (!key && label !== "curriculum") { setB2bResult("Сначала выдайте API-ключ (кнопка выше)."); setB2bRunning(false); return; }
    try {
      const r = await fn(key);
      setB2bResult(JSON.stringify(r, null, 2));
      addLog(`B2B ${label}: OK (stub)`);
    } catch (e: any) {
      setB2bResult("Ошибка: " + (e?.message || "server offline"));
      addLog(`B2B ${label}: ${e?.message}`);
    }
    setB2bRunning(false);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wide flex items-center gap-2">
            <Bot size={24} className="text-[var(--signal)]" /> Admin Panel
          </h1>
          <p className="mt-1 text-sm text-[var(--inkSoft)]">AI Co-Pilot · Content Pipeline · Safety Controls</p>
        </div>
        <div className="flex gap-2">
          <span className="pill"
            style={{ background: serverStatus === "connected" ? `${C.long}1a` : `${C.gold}1a`, color: serverStatus === "connected" ? C.long : C.gold, border: `1px solid ${serverStatus === "connected" ? C.long : C.gold}44` }}>
            {serverStatus === "connected" ? "Server" : "Offline"}
          </span>
          <span className="pill"
            style={{ background: safetyStatus.globalHalted ? `${C.short}1a` : `${C.long}1a`, color: safetyStatus.globalHalted ? C.short : C.long, border: `1px solid ${safetyStatus.globalHalted ? C.short : C.long}44` }}>
            {safetyStatus.globalHalted ? "HALTED" : "Running"}
          </span>
        </div>
      </div>

      {/* Safety Bar */}
      <div className="panel p-4 flex items-center gap-3 flex-wrap">
        <Shield size={18} className={safetyStatus.globalHalted ? "text-[var(--short)]" : "text-[var(--long)]"} />
        <span className="font-mono text-[11px] text-[var(--inkSoft)]">Global kill-switch:</span>
        <button onClick={haltAll} disabled={safetyStatus.globalHalted}
          className="px-4 py-2 rounded-xl bg-[var(--short)]/10 text-[var(--short)] border border-[var(--short)]/30 font-heading text-xs font-bold hover:bg-[var(--short)]/20 transition-colors flex items-center gap-1.5 disabled:opacity-30">
          <ShieldOff size={14} /> HALT ALL
        </button>
        <button onClick={resumeAll} disabled={!safetyStatus.globalHalted}
          className="px-4 py-2 rounded-xl bg-[var(--long)]/10 text-[var(--long)] border border-[var(--long)]/30 font-heading text-xs font-bold hover:bg-[var(--long)]/20 transition-colors flex items-center gap-1.5 disabled:opacity-30">
          <Activity size={14} /> RESUME ALL
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 w-fit flex-wrap">
        {[
          { id: "chat" as const, label: "AI Chat", Icon: Bot },
          { id: "generator" as const, label: "Generator", Icon: Sparkles },
          { id: "scenarios" as const, label: "Scenarios", Icon: Database },
          { id: "pipeline" as const, label: "Pipeline", Icon: Terminal },
          { id: "safety" as const, label: "Safety", Icon: Shield },
          { id: "simulation" as const, label: "Simulation", Icon: FlaskConical },
          { id: "b2b" as const, label: "B2B API", Icon: Key },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-heading text-xs font-semibold ${tab === id ? "bg-[var(--signal)]/10 text-[var(--signal)]" : "text-[var(--inkDim)] hover:text-[var(--inkSoft)]"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* CHAT TAB */}
        {tab === "chat" && (
          <motion.div key="chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="panel flex flex-col" style={{ height: "500px" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--edge)]">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-[var(--signal)]" />
                  <span className="font-display text-sm font-bold">AI Co-Pilot Chat</span>
                </div>
                <button onClick={() => setChatMessages([chatMessages[0]])} className="btn-ghost px-2 py-1 text-[10px] text-[var(--inkDim)]">Clear</button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user" ? "bg-[var(--signal)]/15 border border-[var(--signal)]/20" :
                      msg.role === "system" ? "bg-[var(--gold)]/10 border border-[var(--gold)]/20" :
                      "bg-[var(--night)] border border-[var(--edge)]"
                    }`}>
                      {msg.agent && <p className="font-mono text-[9px] font-bold text-[var(--signal)] mb-1">{msg.agent}</p>}
                      <p className="whitespace-pre-wrap leading-relaxed text-xs text-[var(--inkSoft)]">{msg.content}</p>
                      <p className="font-mono text-[8px] text-[var(--inkDim)] mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-[var(--edge)] px-5 py-3">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl border border-[var(--edge)] bg-white/[0.03] px-4 py-2.5 font-mono text-xs text-[var(--ink)] placeholder-[var(--inkDim)] outline-none focus:border-[var(--signal)]/30"
                    placeholder="Ask agents: summary, retention, economy, event, scenario, security..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button onClick={sendMessage} disabled={sending || !input.trim()} className="btn-primary px-4 py-2.5 disabled:opacity-30">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* GENERATOR TAB */}
        {tab === "generator" && (
          <motion.div key="gen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="panel p-6 space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><Sparkles size={18} className="text-[var(--gold)]"/> Scenario Generator</h2>
            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Entity</label>
                <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)]">
                  {MARKET_ENTITIES.map((e) => (<option key={e.id} value={e.id}>{e.nameRu}</option>))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Level</label>
                <input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} min={1} max={99} className="mt-1 w-full rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)]"/>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Count</label>
                <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={20} className="mt-1 w-full rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)]"/>
              </div>
              <div className="flex items-end">
                <button onClick={generateScenarios} disabled={generating} className="btn-gold w-full text-sm py-2.5">
                  <Sparkles size={14}/> {generating ? "..." : `Generate ${count}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCENARIOS TAB */}
        {tab === "scenarios" && (
          <motion.div key="scen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold"><Database size={16} className="inline text-[var(--signal)]"/> Scenarios ({scenarios.length}) · live DB</h2>
              <button onClick={loadScenarios} className="btn-ghost px-2 py-1 text-[10px]" disabled={scenariosLoading}>
                <RefreshCw size={11} className={scenariosLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {scenarios.length === 0 ? (
              <p className="text-center text-[var(--inkDim)] text-sm py-8">{scenariosLoading ? "Loading…" : "No scenarios. Generate in Generator tab."}</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {scenarios.map((s) => (
                  <div key={s.id} className="rounded-xl border bg-black/20 p-3 flex items-center justify-between gap-2 flex-wrap"
                    style={{ borderColor: s.approved ? `${C.long}33` : `${C.gold}22` }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="pill" style={{background: `${C.signal}1a`, color: C.signal, border: `1px solid ${C.signal}44`}}>Lv.{s.level}</span>
                        <span className="pill" style={{background: s.approved ? `${C.long}1a` : `${C.gold}1a}`, color: s.approved ? C.long : C.gold, border: `1px solid ${s.approved ? C.long : C.gold}44`}}>
                          {s.approved ? "LIVE" : "DRAFT"}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--inkDim)]">{s.entityId} · {s.asset}</span>
                      </div>
                      <p className="font-mono text-[10px] text-[var(--inkSoft)] mt-1 truncate">{s.title} — {s.briefing}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => verifyScenario(s.id)} className="btn-ghost px-2 py-1 text-[9px]" title="AI-копилот: проверить сценарий">
                        <Shield size={11} /> Verify
                      </button>
                      {!s.approved && (
                        <button onClick={() => publishScenario(s.id)} className="btn-ghost px-2 py-1 text-[9px]" title="Одобрить + выпустить в подписанный пак">
                          <CheckCircle2 size={11} /> Publish
                        </button>
                      )}
                      <button onClick={() => deleteScenario(s.id)} className="text-[var(--inkDim)] hover:text-[var(--short)]"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* PIPELINE TAB */}
        {tab === "pipeline" && (
          <motion.div key="pipe" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold flex items-center gap-2"><Terminal size={16} className="text-[var(--signal)]"/> Content Pipeline · signed pack</h2>
              <button onClick={loadPack} className="btn-ghost px-2 py-1 text-[10px]"><RefreshCw size={11} /> Refresh</button>
            </div>
            {packInfo ? (
              <div className="grid sm:grid-cols-5 gap-2">
                {[
                  ["Entities", packInfo.items?.entities, C.long],
                  ["Cards", packInfo.items?.cards, C.signal],
                  ["Scenarios", packInfo.items?.scenarios, C.gold],
                  ["Pack Ver.", "v" + packInfo.version, C.long],
                  ["Signature", packInfo.signature ? packInfo.signature.slice(0, 10) + "…" : "—", C.signal],
                ].map(([label, val, c]) => (
                  <div key={label as string} className="rounded-lg bg-black/30 py-3 px-2 text-center">
                    <p className="font-mono text-[11px] font-bold" style={{ color: c as string }}>{val}</p>
                    <p className="text-[9px] text-[var(--inkDim)]">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[10px] text-[var(--inkDim)]">Server offline — signed pack недоступен.</p>
            )}
            <div className="rounded-xl border border-[var(--edge)] bg-black/30 p-4 max-h-48 overflow-y-auto">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-[var(--signal)] mb-2">Logs</h3>
              {logs.length === 0 ? <p className="font-mono text-[10px] text-[var(--inkDim)] text-center py-4">Logs will appear here.</p> : logs.map((l, i) => <p key={i} className="font-mono text-[9px] text-[var(--inkSoft)]">{l}</p>)}
            </div>
          </motion.div>
        )}

        {/* SAFETY TAB */}
        {tab === "safety" && (
          <motion.div key="safety" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="panel p-6">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Shield size={18} className={safetyStatus.globalHalted ? "text-[var(--short)]" : "text-[var(--long)]"} />
                Safety Control Center
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border-2 border-[var(--short)]/30 bg-[var(--short)]/5 p-6 text-center">
                  <ShieldOff size={32} className="mx-auto text-[var(--short)] mb-3" />
                  <p className="font-heading text-lg font-bold text-[var(--short)]">EMERGENCY HALT</p>
                  <p className="text-xs text-[var(--inkSoft)] mt-1 mb-4">Stop ALL AI agents immediately.</p>
                  <button onClick={haltAll} disabled={safetyStatus.globalHalted}
                    className="px-6 py-3 rounded-xl bg-[var(--short)] text-white font-display font-bold uppercase tracking-wider hover:bg-[var(--short)]/80 disabled:opacity-30 transition-all text-sm">
                    HALT ALL AGENTS
                  </button>
                </div>
                <div className="rounded-2xl border-2 border-[var(--long)]/30 bg-[var(--long)]/5 p-6 text-center">
                  <Activity size={32} className="mx-auto text-[var(--long)] mb-3" />
                  <p className="font-heading text-lg font-bold text-[var(--long)]">RESUME</p>
                  <p className="text-xs text-[var(--inkSoft)] mt-1 mb-4">Resume all agents after halt.</p>
                  <button onClick={resumeAll} disabled={!safetyStatus.globalHalted}
                    className="px-6 py-3 rounded-xl bg-[var(--long)] text-[var(--void)] font-display font-bold uppercase tracking-wider hover:bg-[var(--long)]/80 disabled:opacity-30 transition-all text-sm">
                    RESUME ALL
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SIMULATION TAB */}
        {tab === "simulation" && (
          <motion.div key="sim" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="panel p-6 space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <FlaskConical size={18} className="text-[var(--signal)]" /> Sandbox Simulation
            </h2>
            <p className="text-sm text-[var(--inkSoft)]">
              Run simulations on sandbox agents. Real agents are NOT aware. Data is isolated.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Scenario</label>
                <select className="mt-1 w-full rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)]">
                  <option>Healthy Growth (90 days)</option>
                  <option>Market Crash -60% (60 days)</option>
                  <option>Force Majeure: DDoS+DB (30 days)</option>
                  <option>Inflation Spiral (45 days)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
                  <FlaskConical size={14} /> Run Simulation
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* B2B TAB (block 4.3 — stub) */}
        {tab === "b2b" && (
          <motion.div key="b2b" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="panel p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold flex items-center gap-2"><Key size={16} className="text-[var(--signal)]" /> B2B API · Trading Education (stub)</h2>
              <button onClick={loadB2bKeys} className="btn-ghost px-2 py-1 text-[10px]"><RefreshCw size={11} /> Refresh</button>
            </div>
            <p className="text-xs text-[var(--inkSoft)]">
              Из WHITEPAPER: сценарии, assessment трейдеров, curriculum, analytics для брокеров/академий.
              Ключи живут в памяти (dev-stub): после рестарта сервера — выдайте заново.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Организация</label>
                <input value={b2bOrg} onChange={(e) => setB2bOrg(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)]" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Тариф</label>
                <select value={b2bTier} onChange={(e) => setB2bTier(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)]">
                  <option value="academy">academy ($999–4999)</option>
                  <option value="exchange">exchange ($2999–9999)</option>
                  <option value="hedge">hedge ($4999–19999)</option>
                  <option value="university">university ($499–1999)</option>
                  <option value="corporate">corporate ($2999–9999)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button onClick={createB2bKey} className="btn-gold w-full text-sm py-2.5"><Key size={14} /> Выдать API-ключ</button>
              </div>
            </div>

            {b2bKeys.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {b2bKeys.map((k) => (
                  <div key={k.key} className="rounded-xl border border-[var(--edge)] bg-black/20 px-3 py-2 flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-[11px] text-[var(--long)] font-bold truncate max-w-[220px]">{k.key}</span>
                    <span className="pill" style={{ background: `${C.signal}1a`, color: C.signal, border: `1px solid ${C.signal}44` }}>{k.tier}</span>
                    <span className="font-mono text-[10px] text-[var(--inkDim)]">{k.org}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[10px] text-[var(--inkDim)]">Ключей пока нет.</p>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">Сущность (для /scenarios)</label>
                <select value={b2bEntity} onChange={(e) => setB2bEntity(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)]">
                  {MARKET_ENTITIES.map((e) => (<option key={e.id} value={e.id}>{e.nameRu}</option>))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--inkDim)]">PlayerId (для /assessment, /analytics)</label>
                <input value={b2bPlayerId} onChange={(e) => setB2bPlayerId(e.target.value)} placeholder="uuid игрока" className="mt-1 w-full rounded-xl border border-[var(--edge)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)]" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button disabled={b2bRunning} onClick={() => b2bTest((k) => api.b2b.scenarios(b2bEntity, { level: 10, count: 5 }, k), "scenarios")} className="btn-ghost py-2 text-xs disabled:opacity-30">GET /scenarios</button>
              <button disabled={b2bRunning} onClick={() => b2bTest((k) => api.b2b.assessment(b2bPlayerId, k), "assessment")} className="btn-ghost py-2 text-xs disabled:opacity-30">GET /assessment</button>
              <button disabled={b2bRunning} onClick={() => b2bTest((k) => api.b2b.curriculum(k), "curriculum")} className="btn-ghost py-2 text-xs disabled:opacity-30">GET /curriculum</button>
              <button disabled={b2bRunning} onClick={() => b2bTest((k) => api.b2b.analytics(b2bPlayerId, k), "analytics")} className="btn-ghost py-2 text-xs disabled:opacity-30">GET /analytics</button>
            </div>

            <div className="rounded-xl border border-[var(--edge)] bg-black/30 p-4 max-h-64 overflow-y-auto">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-[var(--signal)] mb-2">Response (stub)</h3>
              <pre className="font-mono text-[10px] text-[var(--inkSoft)] whitespace-pre-wrap">{b2bResult || "Выберите endpoint слева выше."}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
