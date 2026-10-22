import { useState, type FormEvent } from "react";
import type { AxiosError } from "axios";
import { CalendarPlus, Trophy } from "lucide-react";
import axiosInstance from "../axios";

type Props = { onOpenTournaments: () => void };

function apiMessage(error: unknown) {
  return (error as AxiosError<{ message?: string }>).response?.data?.message
    ?? (error instanceof Error ? error.message : "La création du tournoi a échoué.");
}

export default function OrganizerDashboardPage({ onOpenTournaments }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"SWISS" | "ROUND_ROBIN">("SWISS");
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [registrationStartsAt, setRegistrationStartsAt] = useState("");
  const [registrationEndsAt, setRegistrationEndsAt] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [isRated, setIsRated] = useState(false);
  const [ratingCategory, setRatingCategory] = useState<"BLITZ" | "RAPID" | "CLASSICAL">("RAPID");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await axiosInstance.post("/tournaments", {
        name,
        description,
        format,
        maxParticipants,
        registrationStartsAt: new Date(registrationStartsAt).toISOString(),
        registrationEndsAt: new Date(registrationEndsAt).toISOString(),
        startsAt: new Date(startsAt).toISOString(),
        isRated,
        ratingCategory: isRated ? ratingCategory : null,
      });
      setNotice("Tournoi créé. Vous pouvez le retrouver dans la liste des tournois.");
      setName("");
      setDescription("");
    } catch (requestError) {
      setError(apiMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">ESPACE ORGANISATEUR</p>
          <h1 className="text-2xl font-semibold text-white">Gestion des tournois</h1>
          <p className="mt-1 text-sm text-slate-400">Créez un événement puis suivez les inscriptions, rondes et classements.</p>
        </div>
        <button type="button" onClick={onOpenTournaments} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
          <Trophy size={16} /> Voir les tournois
        </button>
      </header>
      {error && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-950/60 p-3 text-sm text-emerald-200">{notice}</p>}
      <form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-white"><CalendarPlus size={18} className="text-amber-200" /> Créer un tournoi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-300">Nom
            <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Format
            <select value={format} onChange={(event) => setFormat(event.target.value as typeof format)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
              <option value="SWISS">Suisse</option>
              <option value="ROUND_ROBIN">Toutes rondes</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">Capacité (2–500)
            <input required type="number" min={2} max={500} value={maxParticipants} onChange={(event) => setMaxParticipants(Number(event.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Début des inscriptions
            <input required type="datetime-local" value={registrationStartsAt} onChange={(event) => setRegistrationStartsAt(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Fin des inscriptions
            <input required type="datetime-local" value={registrationEndsAt} onChange={(event) => setRegistrationEndsAt(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Début du tournoi
            <input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
        </div>
        <label className="block space-y-1 text-sm text-slate-300">Description
          <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={isRated} onChange={(event) => setIsRated(event.target.checked)} />
            Tournoi classé
          </label>
          {isRated && (
            <select aria-label="Catégorie de classement" value={ratingCategory} onChange={(event) => setRatingCategory(event.target.value as typeof ratingCategory)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              <option value="BLITZ">Blitz</option>
              <option value="RAPID">Rapide</option>
              <option value="CLASSICAL">Classique</option>
            </select>
          )}
          <button disabled={loading} className="ml-auto rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-200 disabled:opacity-50">
            {loading ? "Création…" : "Créer le tournoi"}
          </button>
        </div>
      </form>
    </section>
  );
}
