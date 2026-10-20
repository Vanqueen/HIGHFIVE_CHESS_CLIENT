import { useCallback, useEffect, useState } from "react";
import type { Square } from "chess.js";
import { ArrowLeft, CheckCircle2, Clock3, Crown, Eye, XCircle } from "lucide-react";
import type { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axios";
import ChessBoard from "../components/ChessBoard";

type BackendGame = {
  id: number;
  status: string;
  result: string | null;
  currentFen: string;
  activeColor: string | null;
  createdAt: string;
  endedAt: string | null;
};

type GameParticipant = {
  id: number;
  userId: number | null;
  color: "WHITE" | "BLACK";
};

type BackendMove = {
  from: string;
  to: string;
  san: string | null;
  ply: number;
};

type GameDetails = {
  game: BackendGame;
  participants: GameParticipant[];
};

type GamesPageProps = {
  onNavigate: (tab: string) => void;
};

function apiMessage(error: unknown) {
  const response = (error as AxiosError<{ message?: string }>).response?.data;
  return response?.message ?? (error instanceof Error ? error.message : "La requête a échoué.");
}

function statusLabel(status: string) {
  return ({
    WAITING: "En attente",
    IN_PROGRESS: "En cours",
    FINISHED: "Terminée",
  } as Record<string, string>)[status] ?? status;
}

function resultLabel(result: string | null) {
  return ({
    WHITE_WIN: "Victoire des Blancs",
    BLACK_WIN: "Victoire des Noirs",
    DRAW: "Match nul",
  } as Record<string, string>)[result ?? ""] ?? result;
}

function formatGameDate(value: unknown, fallback?: unknown) {
  const candidates = [value, fallback];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" && typeof candidate !== "number" && !(candidate instanceof Date)) {
      continue;
    }
    const date = candidate instanceof Date ? candidate : new Date(candidate);
    if (Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
    }
  }
  return "Date indisponible";
}

export default function GamesPage({ onNavigate }: GamesPageProps) {
  const { profile } = useAuth();
  const [games, setGames] = useState<BackendGame[]>([]);
  const [selected, setSelected] = useState<GameDetails | null>(null);
  const [moves, setMoves] = useState<BackendMove[]>([]);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get<BackendGame[]>("/games/me");
      setGames(data);
    } catch (requestError) {
      setError(apiMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchGames);
  }, [fetchGames]);

  const openGame = async (game: BackendGame) => {
    setSelectedLoading(true);
    setError("");
    try {
      const [{ data: details }, { data: history }] = await Promise.all([
        axiosInstance.get<GameDetails>(`/games/${game.id}`),
        axiosInstance.get<BackendMove[]>(`/games/${game.id}/moves`),
      ]);
      setSelected(details);
      setMoves(history);
    } catch (requestError) {
      setError(apiMessage(requestError));
    } finally {
      setSelectedLoading(false);
    }
  };

  if (selected) {
    const myId = Number(profile?.id);
    const ownParticipant = selected.participants.find((item) => item.userId === myId);
    const white = selected.participants.find((item) => item.color === "WHITE");
    const black = selected.participants.find((item) => item.color === "BLACK");
    const lastMove = moves.at(-1);
    const listedGameDate = games.find((game) => game.id === selected.game.id)?.createdAt;

    return (
      <section className="space-y-5">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à mes parties
        </button>
        {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">PARTIE · #{selected.game.id}</p>
                <h1 className="text-xl font-semibold text-white">{statusLabel(selected.game.status)}</h1>
              </div>
              {selected.game.result && <p className="text-sm text-amber-200">{resultLabel(selected.game.result)}</p>}
            </div>
            <div className="flex justify-center">
              <ChessBoard
                fen={selected.game.currentFen}
                selectedSquare={null}
                legalTargets={[]}
                lastMove={lastMove ? { from: lastMove.from as Square, to: lastMove.to as Square } : null}
                onSquareClick={() => {}}
                flipped={ownParticipant?.color === "BLACK"}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
              <h2 className="mb-3 font-semibold text-white">Joueurs</h2>
              <p className="text-sm text-slate-300">Blancs · {white?.userId ? `Compte ${white.userId}` : "—"}</p>
              <p className="mt-2 text-sm text-slate-300">Noirs · {black?.userId ? `Compte ${black.userId}` : "—"}</p>
              <p className="mt-4 text-xs text-slate-500">
                {formatGameDate(selected.game.createdAt, listedGameDate)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
              <h2 className="mb-3 font-semibold text-white">Coups</h2>
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {moves.length === 0 ? <p className="text-sm text-slate-500">Aucun coup joué.</p> : moves.map((move, index) => (
                  <div key={move.ply ?? index} className="flex gap-3 rounded px-2 py-1 text-sm hover:bg-slate-800">
                    <span className="w-7 text-slate-500">{Math.floor(index / 2) + 1}.</span>
                    <span className="text-slate-200">{move.san ?? `${move.from}–${move.to}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">VOTRE HISTORIQUE</p>
          <h1 className="text-2xl font-semibold text-white">Mes parties</h1>
        </div>
        <button
          onClick={() => onNavigate("play")}
          className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200"
        >
          Nouvelle partie
        </button>
      </header>
      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Chargement de vos parties…</p>}

      {!loading && games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-14 text-center">
          <Crown className="mx-auto h-10 w-10 text-slate-600" aria-hidden="true" />
          <p className="mt-3 font-medium text-slate-200">Aucune partie pour le moment</p>
          <button onClick={() => onNavigate("play")} className="mt-3 text-sm text-amber-300 hover:text-amber-200">Lancer une partie</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <button
              key={game.id}
              disabled={selectedLoading}
              onClick={() => void openGame(game)}
              className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 text-left transition hover:border-amber-500/40 hover:bg-slate-900 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Partie #{game.id}</span>
                {game.status === "FINISHED"
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  : game.status === "IN_PROGRESS"
                    ? <Clock3 className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    : <XCircle className="h-4 w-4 text-slate-400" aria-hidden="true" />}
              </div>
              <p className="mt-3 font-medium text-white">{statusLabel(game.status)}</p>
              <p className="mt-1 text-sm text-slate-400">{resultLabel(game.result) ?? "Résultat non disponible"}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs text-amber-200"><Eye className="h-3.5 w-3.5" /> Voir la partie</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
