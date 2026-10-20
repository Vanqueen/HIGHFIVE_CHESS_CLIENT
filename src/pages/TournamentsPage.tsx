import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Medal, Trophy } from "lucide-react";
import type { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axios";

type Tournament = {
  id: number;
  name: string;
  description: string | null;
  format: "SWISS" | "ROUND_ROBIN";
  status: string;
  maxParticipants: number;
  registrationStartsAt: string;
  registrationEndsAt: string;
  startsAt: string;
  isRated: boolean;
  ratingCategory: string | null;
};

type TournamentDetails = {
  tournament: Tournament;
  participants: Array<{
    id: number;
    userId: number | null;
    displayName: string | null;
    status: string;
  }>;
  rounds: Array<{ id: number; roundNumber: number; status: string }>;
};

type TournamentRound = {
  round: { id: number; roundNumber: number; status: string };
  games: Array<{
    game: { id: number; status: string; result: string | null };
    participants: Array<{ color: "WHITE" | "BLACK"; userId: number | null }>;
  }>;
};

type Standing = {
  rank: number;
  participantId: number;
  userId: number | null;
  displayName: string;
  status: string;
  score: number;
  wins: number;
  draws: number;
  losses: number;
  byes: number;
};

function messageFor(error: unknown) {
  const response = (error as AxiosError<{ message?: string }>).response?.data;
  return response?.message ?? (error instanceof Error ? error.message : "La requête a échoué.");
}

function dateLabel(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const statusLabels: Record<string, string> = {
  DRAFT: "Bientôt",
  REGISTRATION_OPEN: "Inscriptions ouvertes",
  REGISTRATION_CLOSED: "Inscriptions closes",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export default function TournamentsPage() {
  const { profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<TournamentDetails | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [activeRound, setActiveRound] = useState<TournamentRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get<Tournament[]>("/tournaments");
      setTournaments(data);
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadTournaments);
  }, [loadTournaments]);

  const openTournament = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const [{ data: details }, { data: scores }] = await Promise.all([
        axiosInstance.get<TournamentDetails>(`/tournaments/${id}`),
        axiosInstance.get<Standing[]>(`/tournaments/${id}/standings`),
      ]);
      setSelected(details);
      setStandings(scores);
      setActiveRound(null);
      setNotice("");
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  };

  const refreshDetails = async () => {
    if (selected) await openTournament(selected.tournament.id);
  };

  const registrationAction = async (join: boolean) => {
    if (!selected) return;
    setLoading(true);
    setError("");
    setNotice("");
    const url = join
      ? `/tournaments/${selected.tournament.id}/register`
      : `/tournaments/${selected.tournament.id}/participants/me`;
    try {
      if (join) await axiosInstance.post(url);
      else await axiosInstance.delete(url);
      setNotice(join ? "Votre inscription est confirmée." : "Vous êtes désinscrit du tournoi.");
      await refreshDetails();
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  };

  if (selected) {
    const tournament = selected.tournament;
    const currentEntry = selected.participants.find(
      (participant) => participant.userId === Number(profile?.id),
    );
    const canJoin = tournament.status === "REGISTRATION_OPEN" && !currentEntry;
    const canWithdraw =
      tournament.status === "REGISTRATION_OPEN" &&
      currentEntry?.status === "REGISTERED";

    return (
      <div className="space-y-5">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Tous les tournois
        </button>
        {error && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-emerald-950/60 p-3 text-sm text-emerald-200">{notice}</p>}

        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">TOURNOI · {tournament.format === "SWISS" ? "SUISSE" : "TOUTES RONDES"}</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">{tournament.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{tournament.description || "Aucune description fournie."}</p>
            </div>
            <span className="rounded-full bg-emerald-950 px-3 py-1.5 text-xs font-medium text-emerald-200">{statusLabels[tournament.status] ?? tournament.status}</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-800/70 p-3"><p className="text-xs text-slate-500">Début du tournoi</p><p className="mt-1 text-sm text-slate-200">{dateLabel(tournament.startsAt)}</p></div>
            <div className="rounded-xl bg-slate-800/70 p-3"><p className="text-xs text-slate-500">Inscription avant</p><p className="mt-1 text-sm text-slate-200">{dateLabel(tournament.registrationEndsAt)}</p></div>
            <div className="rounded-xl bg-slate-800/70 p-3"><p className="text-xs text-slate-500">Participants</p><p className="mt-1 text-sm text-slate-200">{selected.participants.length} / {tournament.maxParticipants}</p></div>
          </div>
          {tournament.isRated && <p className="mt-3 text-xs text-amber-200">Tournoi classé · {tournament.ratingCategory}</p>}

          {(canJoin || canWithdraw) && (
            <button
              disabled={loading}
              onClick={() => void registrationAction(canJoin)}
              className="mt-5 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-200 disabled:opacity-50"
            >
              {loading ? <LoaderCircle className="inline h-4 w-4 animate-spin" /> : null}
              {canJoin ? "S’inscrire au tournoi" : "Se désinscrire"}
            </button>
          )}
          {currentEntry && !canWithdraw && <p className="mt-4 text-sm text-emerald-200">Vous participez à ce tournoi ({currentEntry.status.toLowerCase()}).</p>}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Medal className="h-5 w-5 text-amber-300" /> Classement</h2>
          {standings.length === 0 ? <p className="text-sm text-slate-400">Le classement sera disponible après la première ronde.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-140 text-left text-sm">
                <thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3">#</th><th className="pb-3">Joueur</th><th className="pb-3">Pts</th><th className="pb-3">V</th><th className="pb-3">N</th><th className="pb-3">D</th><th className="pb-3">Byes</th></tr></thead>
                <tbody>
                  {standings.map((standing) => <tr key={standing.participantId} className="border-t border-slate-800 text-slate-300"><td className="py-3 font-medium text-amber-200">{standing.rank}</td><td>{standing.displayName}</td><td>{standing.score}</td><td>{standing.wins}</td><td>{standing.draws}</td><td>{standing.losses}</td><td>{standing.byes}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Rondes</h2>
          {selected.rounds.length === 0 ? <p className="text-sm text-slate-400">Les rondes seront générées au démarrage du tournoi.</p> : (
            <div className="flex flex-wrap gap-2">
              {selected.rounds.map((round) => <button key={round.id} onClick={async () => {
                setError("");
                try {
                  const { data } = await axiosInstance.get<TournamentRound>(`/tournaments/${tournament.id}/rounds/${round.roundNumber}`);
                  setActiveRound(data);
                } catch (roundError) {
                  setError(messageFor(roundError));
                }
              }} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700">Ronde {round.roundNumber}</button>)}
            </div>
          )}
          {activeRound && (
            <div className="mt-5 space-y-2">
              <h3 className="text-sm font-medium text-slate-300">
                Appariements · Ronde {activeRound.round.roundNumber}
              </h3>
              {activeRound.games.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune partie n’est enregistrée pour cette ronde.</p>
              ) : activeRound.games.map(({ game, participants }) => {
                const white = participants.find((participant) => participant.color === "WHITE");
                const black = participants.find((participant) => participant.color === "BLACK");
                const displayName = (userId: number | null) => selected.participants.find(
                  (participant) => participant.userId === userId,
                )?.displayName ?? (userId ? `Compte ${userId}` : "À déterminer");
                return (
                  <div key={game.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-800/70 px-3 py-2.5 text-sm">
                    <span className="text-slate-200">{displayName(white?.userId ?? null)} <span className="text-slate-500">—</span> {displayName(black?.userId ?? null)}</span>
                    <span className="text-xs text-slate-400">
                      {statusLabels[game.status] ?? game.status}
                      {game.result ? ` · ${game.result}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">COMPÉTITION</p><h1 className="text-2xl font-semibold text-white">Tournois</h1><p className="mt-1 text-sm text-slate-400">Découvrez les événements et suivez les classements.</p></div>
        <button disabled={loading} onClick={() => void loadTournaments()} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">Actualiser</button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
      {loading && tournaments.length === 0 ? <p className="text-sm text-slate-400"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Chargement des tournois…</p> : null}
      {!loading && tournaments.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center"><Trophy className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 text-sm text-slate-300">Aucun tournoi publié pour le moment.</p></div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {tournaments.map((tournament) => (
            <button key={tournament.id} onClick={() => void openTournament(tournament.id)} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 text-left transition hover:border-amber-500/40 hover:bg-slate-900">
              <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">{tournament.format === "SWISS" ? "SYSTÈME SUISSE" : "TOUTES RONDES"}</p><h2 className="text-lg font-semibold text-white">{tournament.name}</h2></div><span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300">{statusLabels[tournament.status] ?? tournament.status}</span></div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-400">{tournament.description || "Tournoi d’échecs de la communauté."}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{dateLabel(tournament.startsAt)}</span><span>Max. {tournament.maxParticipants} joueurs</span></div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
