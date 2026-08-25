import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

interface DuelState {
  roomId: string | null;
  opponent: { name: string; rank: number; rating: number } | null;
  phase: "idle" | "queued" | "matched" | "battle" | "result";
  queuePosition: number; estimatedWait: number; battleId: string | null;
}
interface PresenceInfo { online: number; dueling: number; queued: number; }

export function useWebSocket(playerId: string, playerRank: number) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [duel, setDuel] = useState<DuelState>({
    roomId: null, opponent: null, phase: "idle", queuePosition: 0, estimatedWait: 0, battleId: null,
  });
  const [presence, setPresence] = useState<PresenceInfo>({ online: 0, dueling: 0, queued: 0 });
  const [opponentAction, setOpponentAction] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<{ playerId: string; message: string; timestamp: number }[]>([]);
  const onOpponentAction = useRef<((action: any) => void) | null>(null);

  useEffect(() => {
    const socket = io(WS_URL, {
      query: { playerId },
      transports: ["websocket", "polling"],
      reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 10,
    });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("duel:queued", (data) => setDuel((d) => ({ ...d, phase: "queued", queuePosition: data.position, estimatedWait: data.estimatedWait })));
    socket.on("duel:cancelled", () => setDuel((d) => ({ ...d, phase: "idle", queuePosition: 0 })));
    socket.on("duel:matched", (data) => {
      const isP1 = data.opponent1 === playerId;
      setDuel((d) => ({ ...d, phase: "matched", roomId: data.roomId, opponent: { name: isP1 ? data.opponent2 : data.opponent1, rank: playerRank, rating: 1500 } }));
    });
    socket.on("duel:queue_update", (data) => setPresence((p) => ({ ...p, queued: data.waiting })));
    socket.on("battle:opponent_action", (data) => { setOpponentAction(data); onOpponentAction.current?.(data); });
    socket.on("battle:opponent_left", () => setDuel((d) => ({ ...d, opponent: { ...d.opponent!, name: d.opponent!.name + " (left)" } })));
    socket.on("battle:opponent_disconnected", () => setDuel((d) => ({ ...d, opponent: { ...d.opponent!, name: d.opponent!.name + " (DC)" } })));
    socket.on("chat:message", (msg) => setChatMessages((prev) => [...prev.slice(-50), msg]));
    socket.on("presence:count", (data) => setPresence((p) => ({ ...p, online: data.online })));
    socket.on("presence:refresh", (data) => setPresence(data));
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [playerId]);

  const joinQueue = useCallback((mode = "ghost", stake = 0) => { socketRef.current?.emit("duel:queue", { rank: playerRank, mode, stake }); }, [playerRank]);
  const cancelQueue = useCallback(() => { socketRef.current?.emit("duel:cancel"); setDuel((d) => ({ ...d, phase: "idle", queuePosition: 0 })); }, []);
  const joinBattleRoom = useCallback((battleId: string, role: string) => { socketRef.current?.emit("battle:join", { battleId, role }); setDuel((d) => ({ ...d, phase: "battle", battleId })); }, []);
  const leaveBattle = useCallback((battleId: string) => { socketRef.current?.emit("battle:leave", { battleId }); setDuel((d) => ({ ...d, phase: "idle", battleId: null, opponent: null, roomId: null })); }, []);
  const sendBattleAction = useCallback((battleId: string, action: string, payload?: any) => { socketRef.current?.emit("battle:action", { battleId, action, payload }); }, []);
  const spectate = useCallback((battleId: string) => { socketRef.current?.emit("spectate:join", { battleId }); }, []);
  const sendChat = useCallback((message: string, channel = "global") => { socketRef.current?.emit("chat:message", { message, channel }); }, []);
  const subscribeTournament = useCallback((tournamentId: string) => { socketRef.current?.emit("tournament:subscribe", { tournamentId }); }, []);
  const onOpponent = useCallback((cb: (action: any) => void) => { onOpponentAction.current = cb; }, []);

  return { connected, duel, presence, opponentAction, chatMessages, joinQueue, cancelQueue, joinBattleRoom, leaveBattle, sendBattleAction, spectate, sendChat, subscribeTournament, onOpponent };
}
