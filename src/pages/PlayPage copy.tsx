import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Chess, type Square } from "chess.js";
import {
  ArrowRight,
  Bot,
  Circle,
  Clock3,
  Copy,
  Flag,
  Handshake,
  Link2,
  LoaderCircle,
  MessageSquare,
  Play,
  RotateCcw,
  Swords,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContextValue";
import axiosInstance from "../axios";
import ChessBoard from "../components/ChessBoard";
import PlayerSearch, { type PlayerSummary } from "../components/PlayerSearch";
import {
  clearGuestGameSession,
  readGuestGameSession,
  saveGuestGameSession,
  type GuestGameSession,
} from "../guestSession";

type PlayPageProps = {
  onNavigate: (tab: string) => void;
  initialTimeSeconds?: number;
  incrementSeconds?: number;
  autoStartGame?: boolean;
  onAutoStartHandled?: () => void;
};

type BackendGame = {
  id: number;
  challengeId?: number | null;
  status: string;
  result: string | null;
  currentFen: string;
  activeColor: "WHITE" | "BLACK" | null;
  initialTimeSeconds: number;
  incrementSeconds: number;
  whiteTimeRemainingMs: string | number | bigint;
  blackTimeRemainingMs: string | number | bigint;
  clockStartedAt?: string | { epochMilliseconds: number } | null;
  startedAt: string | null;
  endedAt: string | null;
  drawOfferParticipantId?: number | null;
  pendingUndoParticipantId?: number | null;
};

type BackendMove = {
  from: string;
  to: string;
  san: string | null;
  ply?: number;
};

type GameChatMessage = {
  id: number | string;
  senderId: number | null;
  senderParticipantId?: number;
  senderName?: string;
  content: string;
  createdAt: string | Date;
};

type Challenge = {
  id: number;
  creatorId: number;
  invitedUserId: number | null;
  status: string;
  expiresAt: string;
  createdAt: string;
};

type PlayerStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
};

type Ack = { success: boolean; error?: string; data?: unknown };

const MOVE_SOUND_STORAGE_KEY = "HIGHFIVE CHESSARENAMoveSoundEnabled";

function errorMessage(error: unknown, fallback: string) {
  const responseData = (error as AxiosError<{ message?: string }>).response?.data;
  return responseData?.message ?? (error instanceof Error ? error.message : fallback);
}

function readGame(value: unknown): BackendGame | null {
  if (!value || typeof value !== "object") return null;
  const game = "game" in value ? value.game : value;
  if (!game || typeof game !== "object") return null;
  const candidate = game as Partial<BackendGame>;
  if (
    typeof candidate.id !== "number" ||
    typeof candidate.status !== "string" ||
    typeof candidate.currentFen !== "string"
  ) return null;
  return candidate as BackendGame;
}

function readChatMessage(value: unknown): GameChatMessage | null {
  if (!value || typeof value !== "object") return null;
  const message = value as Partial<GameChatMessage>;
  if (
    (typeof message.id !== "number" && typeof message.id !== "string") ||
    typeof message.content !== "string"
  ) return null;
  const createdAt = message.createdAt instanceof Date
    ? message.createdAt.toISOString()
    : typeof message.createdAt === "string"
      ? message.createdAt
      : new Date().toISOString();
  return {
    id: message.id,
    senderId: typeof message.senderId === "number" ? message.senderId : null,
    ...(typeof message.senderParticipantId === "number"
      ? { senderParticipantId: message.senderParticipantId }
      : {}),
    ...(typeof message.senderName === "string" ? { senderName: message.senderName } : {}),
    content: message.content,
    createdAt,
  };
}

function formatClock(milliseconds: string | number | bigint | undefined) {
  const ms = Number(milliseconds ?? 0);
  if (!Number.isFinite(ms)) return "00:00";
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

function timestampMilliseconds(value: BackendGame["clockStartedAt"]): number {
  if (typeof value === "string") return Date.parse(value);
  if (value && typeof value === "object") return value.epochMilliseconds;
  return Number.NaN;
}

function displayStatus(status: string) {
  return ({
    PENDING: "En attente",
    ACCEPTED: "Accepté",
    DECLINED: "Refusé",
    CANCELLED: "Annulé",
    EXPIRED: "Expiré",
    WAITING: "En attente des joueurs",
    IN_PROGRESS: "En cours",
    FINISHED: "Terminée",
  } as Record<string, string>)[status] ?? status;
}

function MoveList({ moves }: { moves: BackendMove[] }) {
  if (moves.length === 0) {
    return <p className="vc-game-empty">Aucun coup joué.</p>;
  }

  return (
    <div className="vc-game-move-list">
      {Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => (
        <div className="vc-game-move-row" key={index}>
          <span>{index + 1}.</span>
          <strong>{moves[index * 2].san ?? `${moves[index * 2].from}–${moves[index * 2].to}`}</strong>
          <strong>
            {moves[index * 2 + 1]
              ? moves[index * 2 + 1].san ?? `${moves[index * 2 + 1].from}–${moves[index * 2 + 1].to}`
              : "—"}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default function PlayPage({
  onNavigate,
  initialTimeSeconds: configuredTimeSeconds = 300,
  incrementSeconds: configuredIncrementSeconds = 0,
  autoStartGame = false,
  onAutoStartHandled,
}: PlayPageProps) {
  const { profile } = useAuth();
  const { socket, connected } = useSocket();
  const currentPath = window.location.pathname;
  const profileTargetId = currentPath.match(/^\/challenge\/([1-9]\d*)\/?$/)?.[1] ?? null;
  const invitationToken = currentPath.match(/^\/challenge-link\/([^/]+)\/?$/)?.[1] ?? null;
  const anonymousInviteToken = currentPath.match(/^\/guest-game\/([^/]+)\/?$/)?.[1] ?? null;
  const [guestSession, setGuestSession] = useState(readGuestGameSession);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeGame, setActiveGame] = useState<BackendGame | null>(() => {
    const saved = readGuestGameSession();
    return saved ? readGame(saved.game) : null;
  });
  const [clockSyncedAt, setClockSyncedAt] = useState(Date.now);
  const [clockNow, setClockNow] = useState(Date.now);
  const [gamePanelTab, setGamePanelTab] = useState<"game" | "chat" | "history">("game");
  const [myParticipantId, setMyParticipantId] = useState<number | null>(
    () => readGuestGameSession()?.participantId ?? null,
  );
  const [myColor, setMyColor] = useState<"WHITE" | "BLACK" | null>(
    () => readGuestGameSession()?.color ?? null,
  );
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem(MOVE_SOUND_STORAGE_KEY) !== "false",
  );
  const [moves, setMoves] = useState<BackendMove[]>([]);
  const [chatMessages, setChatMessages] = useState<GameChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [targetPlayer, setTargetPlayer] = useState<PlayerSummary | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [linkProcessing, setLinkProcessing] = useState(false);
  const [initialTimeSeconds, setInitialTimeSeconds] = useState(configuredTimeSeconds);
  const [incrementSeconds, setIncrementSeconds] = useState(configuredIncrementSeconds);
  const [inviteTokenInput, setInviteTokenInput] = useState("");
  const [colorPreference, setColorPreference] = useState<"WHITE" | "BLACK" | "RANDOM">("RANDOM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const activeGameRef = useRef<BackendGame | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dismissedGameIds = useRef(new Set<number>());
  const processedInvitation = useRef<string | null>(null);
  const processedAnonymousInvitation = useRef<string | null>(null);
  const autoStartHandled = useRef(false);

  const applyGameSnapshot = useCallback((game: BackendGame, synchronizedAt?: number) => {
    activeGameRef.current = game;
    setActiveGame(game);
    const turnStartedAt = timestampMilliseconds(game.clockStartedAt);
    setClockSyncedAt(
      synchronizedAt ?? (Number.isFinite(turnStartedAt) ? turnStartedAt : Date.now()),
    );
  }, []);

  const playMoveSound = useCallback((capture: boolean) => {
    if (!soundEnabledRef.current || typeof window.AudioContext === "undefined") return;
    const context = audioContextRef.current?.state === "closed"
      ? new AudioContext()
      : audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.setValueAtTime(capture ? 620 : 340, now);
    oscillator.frequency.exponentialRampToValueAtTime(capture ? 240 : 190, now + 0.11);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
    oscillator.start(now);
    oscillator.stop(now + 0.11);
  }, []);

  const toggleMoveSound = () => {
    const enabled = !soundEnabledRef.current;
    soundEnabledRef.current = enabled;
    setSoundEnabled(enabled);
    localStorage.setItem(MOVE_SOUND_STORAGE_KEY, String(enabled));
  };

  useEffect(() => () => {
    if (audioContextRef.current?.state !== "closed") {
      void audioContextRef.current?.close();
    }
  }, []);

  useEffect(() => {
    if (
      !guestSession ||
      !activeGame ||
      guestSession.gameId !== activeGame.id ||
      guestSession.game === activeGame
    ) return;
    saveGuestGameSession({ ...guestSession, game: activeGame });
  }, [activeGame, guestSession]);

  const activeGuestGameId = activeGame && guestSession?.gameId === activeGame.id
    ? activeGame.id
    : null;

  useEffect(() => {
    if (activeGuestGameId === null) return;
    let cancelled = false;
    void axiosInstance.get<BackendMove[]>(`/games/guest/${activeGuestGameId}/moves`)
      .then(({ data }) => {
        if (!cancelled) setMoves(data);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setError(errorMessage(requestError, "Impossible de restaurer la partie invitée."));
        clearGuestGameSession();
        setGuestSession(null);
        setActiveGame(null);
        setMyParticipantId(null);
        setMyColor(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeGuestGameId]);

  useEffect(() => {
    if (!activeGame || activeGame.status !== "IN_PROGRESS") return;
    const interval = window.setInterval(() => setClockNow(Date.now()), 200);
    return () => window.clearInterval(interval);
  }, [activeGame]);

  useEffect(() => {
    if (!profileTargetId) return;
    let cancelled = false;
    void axiosInstance.get<PlayerSummary>(`/users/public/${profileTargetId}`)
      .then(({ data }) => {
        if (!cancelled) setTargetPlayer(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(errorMessage(requestError, "Ce lien de défi ne correspond à aucun joueur."));
      });
    return () => {
      cancelled = true;
    };
  }, [profileTargetId]);

  useEffect(() => {
    if (!invitationToken || processedInvitation.current === invitationToken) return;
    processedInvitation.current = invitationToken;
    void Promise.resolve().then(async () => {
      setLinkProcessing(true);
      setError("");
      try {
        const { data } = await axiosInstance.post<{
          game?: BackendGame;
          participant?: { id: number; color: "WHITE" | "BLACK" };
          guestSessionToken?: string;
        }>("/invitation-links/redeem", { token: invitationToken });
        const game = readGame(data);
        if (!game || !data.participant) {
          throw new Error("Le serveur n’a pas retourné la partie associée à ce lien.");
        }
        applyGameSnapshot(game);
        setMyParticipantId(data.participant.id);
        setMyColor(data.participant.color);
        if (data.guestSessionToken) {
          const session: GuestGameSession = {
            gameId: game.id,
            participantId: data.participant.id,
            color: data.participant.color,
            token: data.guestSessionToken,
            game,
          };
          saveGuestGameSession(session);
          setGuestSession(session);
        } else {
          const { data: moveData } = await axiosInstance.get<BackendMove[]>(`/games/${game.id}/moves`);
          setMoves(moveData);
          if (guestSession) {
            clearGuestGameSession();
            setGuestSession(null);
          }
        }
        setNotice("Défi accepté. La partie est prête.");
      } catch (requestError) {
        setError(errorMessage(requestError, "Impossible d’accepter ce défi."));
      } finally {
        window.history.replaceState(null, "", "/");
        setLinkProcessing(false);
      }
    });
  }, [applyGameSnapshot, guestSession, invitationToken]);

  useEffect(() => {
    if (
      !anonymousInviteToken ||
      processedAnonymousInvitation.current === anonymousInviteToken
    ) return;
    processedAnonymousInvitation.current = anonymousInviteToken;
    void Promise.resolve().then(async () => {
      setLinkProcessing(true);
      setError("");
      try {
        const { data } = await axiosInstance.post<{
          game?: BackendGame;
          participant?: { id: number; color: "WHITE" | "BLACK" };
          guestSessionToken?: string;
        }>("/invitation-links/anonymous/redeem", { token: anonymousInviteToken });
        const game = readGame(data);
        if (!game || !data.participant || (!profile && !data.guestSessionToken)) {
          throw new Error("Le serveur n’a pas retourné les informations du joueur.");
        }
        if (data.guestSessionToken) {
          const session: GuestGameSession = {
            gameId: game.id,
            participantId: data.participant.id,
            color: data.participant.color,
            token: data.guestSessionToken,
            game,
          };
          saveGuestGameSession(session);
          setGuestSession(session);
        } else {
          const { data: moveData } = await axiosInstance.get<BackendMove[]>(`/games/${game.id}/moves`);
          setMoves(moveData);
          if (guestSession) {
            clearGuestGameSession();
            setGuestSession(null);
          }
        }
        setMyParticipantId(data.participant.id);
        setMyColor(data.participant.color);
        if (data.guestSessionToken) setMoves([]);
        applyGameSnapshot(game);
        setNotice("Vous avez rejoint la partie. En attente de l’adversaire…");
      } catch (requestError) {
        setError(errorMessage(requestError, "Impossible de rejoindre cette partie."));
      } finally {
        window.history.replaceState(null, "", "/");
        setLinkProcessing(false);
      }
    });
  }, [anonymousInviteToken, applyGameSnapshot, guestSession, profile]);

  useEffect(() => {
    activeGameRef.current = activeGame;
  }, [activeGame]);

  const fetchDashboard = useCallback(async () => {
    if (!profile) return;
    try {
      const [{ data: challengeData }, { data: gameData }, { data: statsData }] =
        await Promise.all([
          axiosInstance.get<Challenge[]>("/challenges/me"),
          axiosInstance.get<BackendGame[]>("/games/me"),
          axiosInstance.get<PlayerStats>("/users/me/statistics"),
        ]);
      setChallenges(challengeData);
      setStats(statsData);

      const waitingGame = gameData.find((game) =>
        (game.status === "WAITING" || game.status === "IN_PROGRESS") &&
        !dismissedGameIds.current.has(game.id) &&
        (game.challengeId == null || challengeData.some(
          (challenge) => challenge.id === game.challengeId && challenge.status === "ACCEPTED",
        ))
      );
      if (waitingGame && !activeGameRef.current && !profileTargetId && !invitationToken) {
        applyGameSnapshot(waitingGame);
        const { data: moveData } = await axiosInstance.get<BackendMove[]>(
          `/games/${waitingGame.id}/moves`,
        );
        setMoves(moveData);
      }
    } catch (requestError) {
      setError(errorMessage(requestError, "Impossible de charger votre espace joueur."));
    }
  }, [applyGameSnapshot, invitationToken, profile, profileTargetId]);

  useEffect(() => {
    if (!profile) return;
    void Promise.resolve().then(fetchDashboard);
  }, [fetchDashboard, profile]);

  useEffect(() => {
    const hasOutgoingPendingChallenge = challenges.some(
      (challenge) =>
        challenge.creatorId === Number(profile?.id) && challenge.status === "PENDING",
    );
    if (activeGame || !connected || !hasOutgoingPendingChallenge) return;
    const interval = window.setInterval(() => void fetchDashboard(), 4_000);
    return () => window.clearInterval(interval);
  }, [activeGame, challenges, connected, fetchDashboard, profile?.id]);

  useEffect(() => {
    const gameId = activeGame?.id;
    if (gameId === undefined) return;
    let cancelled = false;
    const chatPath = guestSession?.gameId === gameId
      ? `/games/guest/${gameId}/messages`
      : `/games/${gameId}/messages`;
    void axiosInstance.get<GameChatMessage[]>(chatPath)
      .then(({ data }) => {
        if (!cancelled) setChatMessages(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(errorMessage(requestError, "Impossible de charger le chat de la partie."));
      });
    return () => {
      cancelled = true;
    };
  }, [activeGame?.id, guestSession?.gameId]);

  useEffect(() => {
    const gameId = activeGame?.id;
    if (!socket || gameId === undefined || !connected) return;
    const onGameState = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const state = payload as {
        game?: unknown;
        participants?: Array<{ id: number; userId: number | null; color: "WHITE" | "BLACK" }>;
        moves?: BackendMove[];
      };
      const game = readGame(state);
      if (game) applyGameSnapshot(game, Date.now());
      if (state.moves) setMoves(state.moves);
      const participant = state.participants?.find(
        (item) => item.userId === Number(profile?.id),
      );
      if (participant) {
        setMyParticipantId(participant.id);
        setMyColor(participant.color);
      }
    };
    const onMove = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const result = payload as { game?: unknown; move?: BackendMove };
      const currentGame = activeGameRef.current;
      const capturedPiece = result.move && currentGame
        ? new Chess(currentGame.currentFen).get(result.move.to as Square)
        : undefined;
      const game = readGame(result);
      if (game) applyGameSnapshot(game);
      if (result.move) {
        setMoves((current) => [...current, result.move!]);
        playMoveSound(Boolean(capturedPiece));
      }
      setSelectedSquare(null);
      setLegalTargets([]);
    };
    const onGameUpdated = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const update = payload as { action?: string; result?: unknown };
      const game = readGame(update.result);
      if (game) applyGameSnapshot(game, Date.now());
      if (update.action === "draw-offered") setNotice("Votre adversaire propose la nulle.");
      if (update.action === "undo-requested") setNotice("Votre adversaire demande à annuler son dernier coup.");
      if (update.action === "draw-accepted") setNotice("La partie se termine par une nulle.");
      if (update.action === "resigned") setNotice("La partie est terminée.");
    };
    const onTimer = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const timer = payload as Partial<BackendGame> & { gameId?: number };
      if (timer.gameId !== gameId) return;
      const current = activeGameRef.current;
      if (!current) return;
      applyGameSnapshot({
        ...current,
        whiteTimeRemainingMs: timer.whiteTimeRemainingMs ?? current.whiteTimeRemainingMs,
        blackTimeRemainingMs: timer.blackTimeRemainingMs ?? current.blackTimeRemainingMs,
        activeColor: timer.activeColor ?? current.activeColor,
      }, Date.now());
    };
    const onGameError = (payload: { message?: string }) => {
      setError(payload.message ?? "Une erreur est survenue dans la partie.");
    };
    const onChatMessage = (payload: unknown) => {
      const message = readChatMessage(payload);
      if (!message) return;
      setChatMessages((current) => (
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message].slice(-50)
      ));
    };
    socket.on("game-state", onGameState);
    socket.on("move-played", onMove);
    socket.on("game-updated", onGameUpdated);
    socket.on("timer-update", onTimer);
    socket.on("game-error", onGameError);
    socket.on("chat-message", onChatMessage);
    socket.emit("join-game", { gameId }, (ack: Ack) => {
      if (!ack?.success) setError(ack?.error ?? "Impossible de rejoindre la partie.");
    });
    return () => {
      socket.emit("leave-game", { gameId });
      socket.off("game-state", onGameState);
      socket.off("move-played", onMove);
      socket.off("game-updated", onGameUpdated);
      socket.off("timer-update", onTimer);
      socket.off("game-error", onGameError);
      socket.off("chat-message", onChatMessage);
    };
  }, [socket, connected, activeGame?.id, profile?.id, applyGameSnapshot, playMoveSound]);

  const chess = useMemo(
    () => new Chess(activeGame?.currentFen),
    [activeGame?.currentFen],
  );

  const createChallenge = async () => {
    setLoading(true);
    setError("");
    setNotice("");
    setShareUrl("");
    try {
      const invitedUserId = targetPlayer?.id ?? null;
      const { data } = await axiosInstance.post<{
        challenge?: { id: number };
      }>("/challenges", {
        invitedUserId,
        initialTimeSeconds,
        incrementSeconds,
        colorPreference,
      });
      if (invitedUserId === null) {
        const challengeId = data.challenge?.id;
        if (!Number.isSafeInteger(challengeId) || !challengeId) {
          throw new Error("Le serveur n’a pas retourné l’identifiant du défi.");
        }
        const { data: link } = await axiosInstance.post<{ token: string }>(
          `/challenges/${challengeId}/invitation-links`,
        );
        if (!link.token) throw new Error("Le serveur n’a pas retourné le lien d’invitation.");
        setShareUrl(`${window.location.origin}/challenge-link/${encodeURIComponent(link.token)}`);
        setNotice("Défi ouvert créé. Partagez ce lien à usage unique dans les 30 prochaines minutes.");
      } else {
        setNotice(`Défi envoyé à ${targetPlayer?.username ?? "ce joueur"}.`);
      }
      if (!profileTargetId) setTargetPlayer(null);
      await fetchDashboard();
    } catch (requestError) {
      setError(errorMessage(requestError, "Impossible de créer le défi."));
    } finally {
      setLoading(false);
    }
  };

  const createAnonymousGame = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    setShareUrl("");
    try {
      const { data } = await axiosInstance.post<{
        game?: BackendGame;
        participant?: { id: number; color: "WHITE" | "BLACK" };
        guestSessionToken?: string;
        inviteToken?: string;
      }>("/invitation-links/anonymous", {
        initialTimeSeconds,
        incrementSeconds,
      });
      const game = readGame(data);
      if (!game || !data.participant || !data.guestSessionToken || !data.inviteToken) {
        throw new Error("Le serveur n’a pas retourné les informations de la partie invitée.");
      }
      const session: GuestGameSession = {
        gameId: game.id,
        participantId: data.participant.id,
        color: data.participant.color,
        token: data.guestSessionToken,
        game,
      };
      saveGuestGameSession(session);
      setGuestSession(session);
      setMyParticipantId(data.participant.id);
      setMyColor(data.participant.color);
      setMoves([]);
      setChatMessages([]);
      applyGameSnapshot(game);
      const inviteUrl = `${window.location.origin}/guest-game/${encodeURIComponent(data.inviteToken)}`;
      setShareUrl(inviteUrl);
      setNotice("Partie créée. Partagez ce lien avec votre adversaire.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Impossible de créer la partie."));
    } finally {
      setLoading(false);
    }
  }, [applyGameSnapshot, incrementSeconds, initialTimeSeconds]);

  useEffect(() => {
    if (!autoStartGame || profile || autoStartHandled.current) return;
    autoStartHandled.current = true;
    onAutoStartHandled?.();
    void createAnonymousGame();
  }, [autoStartGame, createAnonymousGame, onAutoStartHandled, profile]);

  const joinAnonymousGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = inviteTokenInput.trim();
    if (!token || loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const { data } = await axiosInstance.post<{
        game?: BackendGame;
        participant?: { id: number; color: "WHITE" | "BLACK" };
        guestSessionToken?: string;
      }>("/invitation-links/anonymous/redeem", { token });
      const game = readGame(data);
      if (!game || !data.participant || (!profile && !data.guestSessionToken)) {
        throw new Error("Le serveur n’a pas retourné les informations du joueur.");
      }
      if (data.guestSessionToken) {
        const session: GuestGameSession = {
          gameId: game.id,
          participantId: data.participant.id,
          color: data.participant.color,
          token: data.guestSessionToken,
          game,
        };
        saveGuestGameSession(session);
        setGuestSession(session);
      } else {
        const { data: moveData } = await axiosInstance.get<BackendMove[]>(`/games/${game.id}/moves`);
        setMoves(moveData);
      }
      setMyParticipantId(data.participant.id);
      setMyColor(data.participant.color);
      setMoves([]);
      setChatMessages([]);
      applyGameSnapshot(game);
      setInviteTokenInput("");
      setNotice("Vous avez rejoint la partie. En attente de l’adversaire…");
    } catch (requestError) {
      setError(errorMessage(requestError, "Impossible de rejoindre cette partie."));
    } finally {
      setLoading(false);
    }
  };

  const copyShareUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setNotice("Lien copié dans le presse-papiers.");
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch (copyError) {
      setError(errorMessage(copyError, "Impossible de copier le lien. Sélectionnez-le puis copiez-le."));
    }
  };

  const handleChallenge = async (
    challenge: Challenge,
    action: "accept" | "decline" | "cancel",
  ) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const { data } = await axiosInstance.post(
        `/challenges/${challenge.id}/${action}`,
      );
      if (action === "accept") {
        const game = readGame(data);
        if (!game) throw new Error("Le serveur n’a pas retourné la partie du défi.");
        applyGameSnapshot(game);
        const result = data as { participant?: { id: number; color: "WHITE" | "BLACK" } };
        setMyParticipantId(result.participant?.id ?? null);
        setMyColor(result.participant?.color ?? null);
        setMoves([]);
      }
      await fetchDashboard();
    } catch (requestError) {
      setError(errorMessage(requestError, "Impossible de traiter ce défi."));
    } finally {
      setLoading(false);
    }
  };

  const handleSquareClick = async (square: Square) => {
    if (
      !activeGame ||
      activeGame.status !== "IN_PROGRESS" ||
      !myColor ||
      activeGame.activeColor !== myColor ||
      chess.turn() !== (myColor === "WHITE" ? "w" : "b")
    ) return;

    if (!selectedSquare) {
      const piece = chess.get(square);
      if (!piece || piece.color !== (myColor === "WHITE" ? "w" : "b")) return;
      setSelectedSquare(square);
      setLegalTargets(chess.moves({ square, verbose: true }).map((move) => move.to));
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    try {
      const move = chess.move({ from: selectedSquare, to: square, promotion: "q" });
      const movePath = guestSession?.gameId === activeGame.id
        ? `/games/guest/${activeGame.id}/moves`
        : `/games/${activeGame.id}/moves`;
      await axiosInstance.post(movePath, {
        from: selectedSquare,
        to: square,
        ...(move.promotion ? { promotion: move.promotion.toUpperCase() } : {}),
      });
    } catch (requestError) {
      setError(errorMessage(requestError, "Ce coup n’est pas autorisé."));
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  };

  const gameAction = async (
    action: "draw-offers" | "undo-requests" | "resign",
    body?: Record<string, boolean | string>,
  ) => {
    if (!activeGame) return;
    setError("");
    try {
      const gamePath = guestSession?.gameId === activeGame.id
        ? `/games/guest/${activeGame.id}`
        : `/games/${activeGame.id}`;
      const { data } = await axiosInstance.post(
        `${gamePath}/${action}`,
        body,
      );
      const game = readGame(data);
      if (game) applyGameSnapshot(game, Date.now());
      setNotice(action === "resign" ? "Vous avez abandonné la partie." : "Action envoyée.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Cette action n’a pas abouti."));
    }
  };

  const respond = async (
    action: "draw-offers/respond" | "undo-requests/respond",
    accept: boolean,
  ) => {
    if (!activeGame) return;
    setError("");
    try {
      const gamePath = guestSession?.gameId === activeGame.id
        ? `/games/guest/${activeGame.id}`
        : `/games/${activeGame.id}`;
      const { data } = await axiosInstance.post(
        `${gamePath}/${action}`,
        { accept },
      );
      const game = readGame(data);
      if (game) applyGameSnapshot(game, Date.now());
      setNotice(accept ? "Demande acceptée." : "Demande refusée.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Impossible de répondre à la demande."));
    }
  };

  const sendChatMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!activeGame || !content || content.length > 2000 || chatSending) return;
    setChatSending(true);
    setError("");
    try {
      const chatPath = guestSession?.gameId === activeGame.id
        ? `/games/guest/${activeGame.id}/messages`
        : `/games/${activeGame.id}/messages`;
      const { data } = await axiosInstance.post(
        chatPath,
        { content },
      );
      const message = readChatMessage(data);
      if (!message) throw new Error("Le serveur n’a pas retourné le message envoyé.");
      setChatMessages((current) => (
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message].slice(-50)
      ));
      setChatInput("");
    } catch (requestError) {
      setError(errorMessage(requestError, "Impossible d’envoyer le message."));
    } finally {
      setChatSending(false);
    }
  };

  const leaveGame = () => {
    if (activeGame) dismissedGameIds.current.add(activeGame.id);
    if (activeGame && guestSession?.gameId === activeGame.id) {
      clearGuestGameSession();
      setGuestSession(null);
      window.history.replaceState(null, "", "/");
    }
    activeGameRef.current = null;
    setActiveGame(null);
    setGamePanelTab("game");
    setMyColor(null);
    setMyParticipantId(null);
    setMoves([]);
    setChatMessages([]);
    setNotice("");
    void fetchDashboard();
  };

  const elapsedClockMs = activeGame?.status === "IN_PROGRESS" &&
    activeGame.initialTimeSeconds > 0 &&
    activeGame.activeColor
    ? Math.max(0, clockNow - clockSyncedAt)
    : 0;
  const whiteClock = Math.max(
    0,
    Number(activeGame?.whiteTimeRemainingMs ?? 0) -
      (activeGame?.activeColor === "WHITE" ? elapsedClockMs : 0),
  );
  const blackClock = Math.max(
    0,
    Number(activeGame?.blackTimeRemainingMs ?? 0) -
      (activeGame?.activeColor === "BLACK" ? elapsedClockMs : 0),
  );
  const ownClock = myColor === "WHITE" ? whiteClock : myColor === "BLACK" ? blackClock : null;
  const opponentClock = myColor === "WHITE" ? blackClock : myColor === "BLACK" ? whiteClock : null;
  const renderClock = (milliseconds: number | null) => {
    if (activeGame?.initialTimeSeconds === 0) return "∞";
    return milliseconds === null ? "--:--" : formatClock(milliseconds);
  };
  if (linkProcessing) {
    return (
      <div className="vc-play-page flex min-h-64 flex-col items-center justify-center gap-3 text-slate-300">
        <LoaderCircle className="h-7 w-7 animate-spin text-amber-300" aria-hidden="true" />
        <p>Vérification du lien et préparation de la partie…</p>
      </div>
    );
  }

  if (activeGame) {
    return (
      <section className="vc-game-screen">
        <header className="vc-game-heading">
          <div className="vc-game-heading__title">
            <Zap size={23} fill="currentColor" aria-hidden="true" />
            <div>
              <h1>Partie rapide</h1>
              <p>Jouez en ligne · {activeGame.initialTimeSeconds === 0
                ? "Sans limite"
                : `${Math.floor(activeGame.initialTimeSeconds / 60)} min + ${activeGame.incrementSeconds} s`}</p>
            </div>
          </div>
          <div className="vc-game-heading__actions">
            <span className={`vc-game-connection${connected ? " is-connected" : ""}`}>
              <i /> {connected ? "En ligne" : "Reconnexion…"}
            </span>
            <button
              type="button"
              onClick={() => setBoardFlipped((flipped) => !flipped)}
              className="vc-game-back"
              aria-label="Inverser l’orientation de l’échiquier"
              title="Inverser l’échiquier"
            >
              <RotateCcw size={16} /> Échiquier
            </button>
            <button
              type="button"
              onClick={toggleMoveSound}
              className="vc-game-back"
              aria-label={soundEnabled ? "Désactiver le son des coups" : "Activer le son des coups"}
              title={soundEnabled ? "Désactiver le son" : "Activer le son"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              Son
            </button>
            <button onClick={leaveGame} className="vc-game-back">
              <ArrowRight size={16} /> Retour au lobby
            </button>
          </div>
        </header>

        {error && <p role="alert" className="vc-game-alert is-error">{error}</p>}
        {notice && <p role="status" className="vc-game-alert is-notice">{notice}</p>}

        <div className="vc-game-layout">
          <section className="vc-game-board-panel" aria-label="Échiquier">
            <div className={`vc-game-player${activeGame.activeColor === (myColor === "WHITE" ? "BLACK" : "WHITE") ? " is-active" : ""}`}>
              <span className="vc-game-avatar"><UserRound size={24} /></span>
              <span className="vc-game-player__identity">
                <strong>Adversaire</strong>
                <small><i /> {myColor ? (myColor === "WHITE" ? "Noirs" : "Blancs") : "Adversaire"}</small>
              </span>
              <span className="vc-game-clock">
                <Clock3 size={20} />
                <strong>{renderClock(opponentClock)}</strong>
              </span>
            </div>

            <div className="vc-game-board-frame">
              <ChessBoard
                fen={activeGame.currentFen}
                selectedSquare={selectedSquare}
                legalTargets={legalTargets}
                lastMove={moves.length ? {
                  from: moves[moves.length - 1].from as Square,
                  to: moves[moves.length - 1].to as Square,
                } : null}
                onSquareClick={handleSquareClick}
                flipped={(myColor === "BLACK") !== boardFlipped}
              />
            </div>

            <div className={`vc-game-player vc-game-player--self${activeGame.activeColor === myColor ? " is-active" : ""}`}>
              <span className="vc-game-avatar vc-game-avatar--self">
                {profile?.avatarUrl
                  ? <img src={profile.avatarUrl} alt="" />
                  : profile?.username?.charAt(0).toUpperCase() ?? "J"}
              </span>
              <span className="vc-game-player__identity">
                <strong>{profile?.username ?? "Vous"} <span aria-label="Joueur">♛</span></strong>
                <small><i /> {myColor === "WHITE" ? "Blancs" : myColor === "BLACK" ? "Noirs" : "Connexion en cours"}</small>
              </span>
              <span className="vc-game-clock">
                <Clock3 size={20} />
                <strong>{renderClock(ownClock)}</strong>
              </span>
            </div>
            {activeGame.status === "WAITING" && (
              <p className="vc-game-status">Votre adversaire doit rejoindre la partie pour démarrer l’horloge.</p>
            )}
            {activeGame.status === "FINISHED" && (
              <p className="vc-game-status is-finished">
                <Trophy size={16} /> Partie terminée · {activeGame.result ?? "résultat enregistré"}
              </p>
            )}
          </section>

          <aside className="vc-game-sidepanel">
            <nav className="vc-game-tabs" aria-label="Panneau de partie">
              <button className={gamePanelTab === "game" ? "is-active" : ""} onClick={() => setGamePanelTab("game")}>Partie</button>
              <button className={gamePanelTab === "chat" ? "is-active" : ""} onClick={() => setGamePanelTab("chat")}>Chat</button>
              <button className={gamePanelTab === "history" ? "is-active" : ""} onClick={() => setGamePanelTab("history")}>Historique</button>
            </nav>

            {gamePanelTab === "game" && (
              <div className="vc-game-panel-content">
                <div className="vc-game-summary">
                  <Zap size={24} fill="currentColor" />
                  <div>
                    <strong>Partie rapide</strong>
                    <span>{activeGame.initialTimeSeconds === 0
                      ? "Sans limite"
                      : `${Math.floor(activeGame.initialTimeSeconds / 60)} min + ${activeGame.incrementSeconds} s`}</span>
                  </div>
                </div>
                <p className="vc-game-color">
                  <Circle size={18} fill={myColor === "BLACK" ? "#18231f" : "#f5f3e9"} />
                  {myColor
                    ? `Vous jouez avec les pièces ${myColor === "WHITE" ? "blanches" : "noires"}`
                    : "Attribution des pièces…"}
                </p>
                <div className="vc-game-panel-section">
                  <h2>Coups joués</h2>
                  <MoveList moves={moves} />
                </div>
                <div className="vc-game-panel-section">
                  <h2>Options</h2>
                  <div className="vc-game-options">
                    <button onClick={() => void gameAction("draw-offers")} disabled={activeGame.status !== "IN_PROGRESS"}>
                      <Handshake size={17} /> Proposer nulle
                    </button>
                    <button onClick={() => void gameAction("undo-requests")} disabled={activeGame.status !== "IN_PROGRESS"}>
                      <RotateCcw size={17} /> Demander une annulation
                    </button>
                    <button onClick={() => void respond("draw-offers/respond", true)} disabled={!activeGame.drawOfferParticipantId || activeGame.drawOfferParticipantId === myParticipantId}>
                      Accepter la nulle
                    </button>
                    <button onClick={() => void respond("undo-requests/respond", true)} disabled={!activeGame.pendingUndoParticipantId || activeGame.pendingUndoParticipantId === myParticipantId}>
                      Accepter l’annulation
                    </button>
                    <button onClick={() => void respond("draw-offers/respond", false)} disabled={!activeGame.drawOfferParticipantId || activeGame.drawOfferParticipantId === myParticipantId}>
                      Refuser la nulle
                    </button>
                    <button onClick={() => void respond("undo-requests/respond", false)} disabled={!activeGame.pendingUndoParticipantId || activeGame.pendingUndoParticipantId === myParticipantId}>
                      Refuser l’annulation
                    </button>
                    <button className="is-danger" onClick={() => void gameAction("resign")} disabled={activeGame.status !== "IN_PROGRESS"}>
                      <Flag size={17} /> Abandonner
                    </button>
                  </div>
                </div>
              </div>
            )}

            {gamePanelTab === "history" && (
              <div className="vc-game-panel-content">
                <div className="vc-game-panel-section">
                  <h2><Clock3 size={16} /> Historique des coups</h2>
                  <MoveList moves={moves} />
                </div>
              </div>
            )}

            {gamePanelTab === "chat" && (
              <div className="vc-game-chat">
                <div className="vc-game-chat__messages" aria-live="polite">
                  {chatMessages.length === 0 ? (
                    <p className="vc-game-empty">Aucun message pour le moment.</p>
                  ) : chatMessages.map((message) => (
                    <div key={message.id} className="vc-game-chat-message">
                      <small>{message.senderName ?? (message.senderId === Number(profile?.id) ? "Vous" : `Joueur ${message.senderId ?? ""}`)}</small>
                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={(event) => void sendChatMessage(event)} className="vc-game-chat__form">
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    maxLength={2000}
                    rows={2}
                    placeholder="Écrire un message…"
                    aria-label="Message du chat de partie"
                  />
                  <button type="submit" disabled={chatSending || !chatInput.trim()} aria-label="Envoyer le message">
                    {chatSending ? <LoaderCircle size={17} className="animate-spin" /> : <MessageSquare size={17} />}
                  </button>
                </form>
              </div>
            )}
          </aside>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <main className="player-dashboard vc-play-page">
        <section className="welcome-line">
          <div>
            <p className="eyebrow">HIGHFIVE CHESSARENA · JEU LIBRE</p>
            <h1>Jouez aux échecs, sans inscription.</h1>
            <p className="welcome-line__text">
              Créez une partie et invitez un ami, ou rejoignez une partie avec son lien.
              Vous pouvez aussi ouvrir un lien de défi envoyé par un joueur inscrit.
            </p>
          </div>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
          >
            Connexion / inscription <ArrowRight size={16} />
          </a>
        </section>
        <a
          href="/computer"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          <Bot size={17} /> Jouer contre l’ordinateur
        </a>

        {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="eyebrow">INVITER UN ADVERSAIRE</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Créer une partie</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              La partie est anonyme et non classée. Un lien à usage unique sera créé pour votre adversaire.
            </p>
            <label className="mt-5 block text-xs text-slate-400">
              Cadence
              <select
                value={initialTimeSeconds}
                onChange={(event) => setInitialTimeSeconds(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value={0}>Sans limite</option>
                <option value={60}>1 minute</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
              </select>
            </label>
            {initialTimeSeconds > 0 && (
              <label className="mt-3 block text-xs text-slate-400">
                Incrément par coup
                <select
                  value={incrementSeconds}
                  onChange={(event) => setIncrementSeconds(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                >
                  <option value={0}>0 seconde</option>
                  <option value={2}>2 secondes</option>
                  <option value={5}>5 secondes</option>
                  <option value={10}>10 secondes</option>
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={() => void createAnonymousGame()}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-200 disabled:opacity-50"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
              Créer et jouer
            </button>
            {shareUrl && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <label htmlFor="guest-share-link" className="mb-2 block text-xs font-medium text-slate-300">
                  Lien à partager
                </label>
                <div className="flex gap-2">
                  <input
                    id="guest-share-link"
                    readOnly
                    value={shareUrl}
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => void copyShareUrl(shareUrl)}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs text-white hover:bg-slate-600"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    {copiedUrl ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="eyebrow">REJOINDRE UNE PARTIE</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Vous avez reçu un lien ?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ouvrez directement le lien reçu ou collez ici le jeton d’invitation d’une partie anonyme.
            </p>
            <form onSubmit={(event) => void joinAnonymousGame(event)} className="mt-5 space-y-3">
              <label htmlFor="guest-invite-token" className="block text-xs text-slate-400">
                Jeton d’invitation
              </label>
              <input
                id="guest-invite-token"
                value={inviteTokenInput}
                onChange={(event) => setInviteTokenInput(event.target.value)}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                placeholder="Collez le jeton du lien"
              />
              <button
                type="submit"
                disabled={loading || !inviteTokenInput.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Rejoindre la partie
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  const pending = challenges.filter((challenge) => challenge.status === "PENDING");
  const history = challenges.filter((challenge) => challenge.status !== "PENDING").slice(0, 5);

  return (
    <div className="player-dashboard vc-play-page">
      <section className="welcome-line">
        <div>
          <p className="eyebrow">VOTRE ESPACE DE JEU</p>
          <h1>Bonjour{profile?.username ? `, ${profile.username}` : ""}.</h1>
          <p className="welcome-line__text">Lancez un défi ou reprenez vos parties en cours.</p>
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</p>}
      {profileTargetId && targetPlayer && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div>
            <p className="eyebrow">LIEN PERMANENT DE DÉFI</p>
            <h2 className="text-lg font-semibold text-white">Vous défiez {targetPlayer.username}</h2>
            <p className="mt-1 text-sm text-slate-400">Choisissez une cadence ci-dessous et envoyez votre défi.</p>
          </div>
          <Swords className="h-7 w-7 text-amber-300" aria-hidden="true" />
        </section>
      )}
      {profileTargetId && !targetPlayer && !error && (
        <p className="text-sm text-slate-400">Chargement du joueur associé au lien…</p>
      )}

      <section className="grid gap-4 sm:grid-cols-4" aria-label="Statistiques">
        {[
          ["Parties", stats?.gamesPlayed],
          ["Victoires", stats?.wins],
          ["Défaites", stats?.losses],
          ["Nulles", stats?.draws],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <strong className="mt-1 block text-2xl text-white">{value ?? "—"}</strong>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <div className="mb-4">
            <p className="eyebrow">NOUVEAU MATCH</p>
            <h2 className="text-xl font-semibold text-white">
              {targetPlayer ? `Défier ${targetPlayer.username}` : "Créer un défi"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Choisissez une cadence, puis recherchez un joueur par pseudonyme ou générez un lien à partager.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="text-xs text-slate-400">
              Joueur à défier (facultatif)
              {profileTargetId ? (
                <p className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200">
                  {targetPlayer?.username ?? "Chargement du joueur…"}
                </p>
              ) : (
                <div className="mt-1">
                  <PlayerSearch
                    selectedPlayer={targetPlayer}
                    onSelect={setTargetPlayer}
                    placeholder="Rechercher par pseudonyme"
                  />
                </div>
              )}
            </div>
          <label className="text-xs text-slate-400">
            Cadence
              <select value={initialTimeSeconds} onChange={(event) => setInitialTimeSeconds(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
                <option value={0}>Sans limite</option>
                <option value={60}>1 + 0</option>
                <option value={180}>3 + 0</option>
                <option value={300}>5 + 0</option>
                <option value={600}>10 + 0</option>
                <option value={900}>15 + 10</option>
              </select>
            </label>
            <label className="text-xs text-slate-400 sm:col-span-2">
              Votre couleur
              <select
                value={colorPreference}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "WHITE" || value === "BLACK" || value === "RANDOM") {
                    setColorPreference(value);
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              >
                <option value="RANDOM">Aléatoire (choix différent à chaque défi)</option>
                <option value="WHITE">Blancs</option>
                <option value="BLACK">Noirs</option>
              </select>
              <span className="mt-1 block text-slate-500">
                Votre adversaire recevra automatiquement l’autre couleur.
              </span>
            </label>
            {initialTimeSeconds > 0 && (
              <label className="text-xs text-slate-400 sm:col-span-2">
                Incrément par coup
                <select value={incrementSeconds} onChange={(event) => setIncrementSeconds(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
                  <option value={0}>0 seconde</option>
                  <option value={2}>2 secondes</option>
                  <option value={5}>5 secondes</option>
                  <option value={10}>10 secondes</option>
                </select>
              </label>
            )}
          </div>
          <button
            onClick={() => void createChallenge()}
            disabled={
              loading ||
              (Boolean(profileTargetId) && !targetPlayer) ||
              targetPlayer?.id === Number(profile?.id)
            }
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-200 disabled:opacity-50"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            {targetPlayer ? "Envoyer le défi" : "Créer un lien de défi"}
          </button>
          {targetPlayer?.id === Number(profile?.id) && (
            <p className="mt-2 text-xs text-rose-300">Vous ne pouvez pas vous défier vous-même.</p>
          )}
          {shareUrl && (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <label htmlFor="challenge-share-link" className="mb-2 block text-xs font-medium text-slate-300">
                Lien à usage unique · valide jusqu’à 30 minutes
              </label>
              <div className="flex gap-2">
                <input
                  id="challenge-share-link"
                  readOnly
                  value={shareUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => void copyShareUrl(shareUrl)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs text-white! hover:bg-slate-600"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-white!">
                    {copiedUrl ? "Copié" : "Copier"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><p className="eyebrow">VOTRE COMPTE</p><h2 className="text-xl font-semibold text-white">Accès rapides</h2></div>
          </div>
          <div className="space-y-2">
            <button onClick={() => onNavigate("computer")} className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700"><span className="flex items-center gap-3"><Bot className="h-4 w-4 text-violet-300" /> Jouer contre l’ordinateur</span><ArrowRight className="h-4 w-4" /></button>
            <button onClick={() => onNavigate("tournaments")} className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700"><span className="flex items-center gap-3"><Trophy className="h-4 w-4 text-amber-300" /> Explorer les tournois</span><ArrowRight className="h-4 w-4" /></button>
            <button onClick={() => onNavigate("users")} className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700"><span className="flex items-center gap-3"><UserRound className="h-4 w-4 text-emerald-300" /> Gérer amis et blocages</span><ArrowRight className="h-4 w-4" /></button>
          </div>
          {profile?.id && (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <p className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-300">
                <Link2 className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                Votre lien permanent de défi
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  aria-label="Votre lien permanent de défi"
                  value={`${window.location.origin}/challenge/${profile.id}`}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => void copyShareUrl(`${window.location.origin}/challenge/${profile.id}`)}
                  className="rounded-lg bg-slate-700 px-3 py-2 text-xs hover:bg-slate-600"
                >
                  <span className="text-white!">
                    {copiedUrl ? "Copié" : "Copier"}
                  </span>
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Ce lien reste valable et permet à un joueur connecté de vous envoyer un défi.</p>
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-slate-500">La messagerie privée n’est pas encore proposée par le serveur. Le chat de partie est disponible pendant une partie.</p>
        </div>
      </section>

      <section className="opponents-section">
        <div className="section-heading">
          <div><p className="eyebrow">INVITATIONS</p><h2>Défis reçus et envoyés</h2></div>
          <button className="text-link" onClick={() => void fetchDashboard()}>Actualiser <RotateCcw className="h-3.5 w-3.5" /></button>
        </div>
        {pending.length === 0 ? (
          <div className="empty-opponents"><Swords aria-hidden="true" /><div><strong>Aucun défi en attente</strong><p>Vos invitations apparaîtront ici.</p></div></div>
        ) : (
          <div className="opponent-grid">
            {pending.map((challenge) => {
              const isInvitee = challenge.invitedUserId === Number(profile?.id);
              return (
                <article key={challenge.id} className="opponent-card">
                  <div className="opponent-card__top"><span className="opponent-avatar"><Swords className="h-5 w-5" /></span><span className="text-xs text-amber-300">Expire {new Date(challenge.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span></div>
                  <strong className="opponent-card__name">{isInvitee ? `Défi reçu · joueur ${challenge.creatorId}` : challenge.invitedUserId ? `Défi envoyé · joueur ${challenge.invitedUserId}` : "Défi ouvert"}</strong>
                  <span className="opponent-card__status">Défi #{challenge.id} · {displayStatus(challenge.status)}</span>
                  {isInvitee ? (
                    <div className="mt-3 flex w-full gap-2">
                      <button disabled={loading} onClick={() => void handleChallenge(challenge, "accept")} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"><Play className="mr-1 inline h-3.5 w-3.5" /> Accepter</button>
                      <button disabled={loading} onClick={() => void handleChallenge(challenge, "decline")} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">Refuser</button>
                    </div>
                  ) : (
                    <button disabled={loading} onClick={() => void handleChallenge(challenge, "cancel")} className="opponent-card__button">Annuler le défi</button>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {history.length > 0 && (
          <details className="mt-4 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <summary className="cursor-pointer text-sm text-slate-300">Historique récent ({history.length})</summary>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              {history.map((challenge) => <li key={challenge.id}>Défi #{challenge.id} · {displayStatus(challenge.status)}</li>)}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
