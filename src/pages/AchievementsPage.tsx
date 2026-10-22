import { useEffect, useState } from "react";
import { Medal } from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "../axios";

type AchievementEntry = {
  id: number;
  progress: number;
  unlockedAt: string | null;
  achievement: {
    name: string;
    description: string;
    category: string;
    requirementValue: number;
  };
};

function errorMessage(error: unknown) {
  const response = (error as AxiosError<{ message?: string }>).response;
  return response?.data?.message ?? (error instanceof Error
    ? error.message
    : "Impossible de charger vos succès.");
}

export default function AchievementsPage() {
  const [entries, setEntries] = useState<AchievementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void axiosInstance.get<AchievementEntry[]>("/users/me/achievements")
      .then(({ data }) => {
        if (!cancelled) {
          setEntries(data);
          setError("");
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-5">
      <header>
        <p className="eyebrow">PROGRESSION</p>
        <h1 className="text-2xl font-semibold text-white">Mes succès</h1>
        <p className="mt-1 text-sm text-slate-400">Suivez vos objectifs et les succès débloqués au fil de vos parties.</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
      {loading ? (
        <p role="status" className="text-sm text-slate-400">Chargement de vos succès…</p>
      ) : entries.length === 0 && !error ? (
        <p className="rounded-xl border border-slate-700 bg-slate-900/70 p-5 text-sm text-slate-400">
          Aucun succès n’est disponible pour le moment. Jouez une partie pour commencer votre progression.
        </p>
      ) : entries.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map(({ id, progress, unlockedAt, achievement }) => {
            const percent = Math.min(100, Math.round(progress / achievement.requirementValue * 100));
            return (
              <li key={id} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                <div className="flex items-start gap-3">
                  <span className={`rounded-xl p-2 ${unlockedAt ? "bg-amber-300/15 text-amber-200" : "bg-slate-800 text-slate-400"}`}>
                    <Medal size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-white">{achievement.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{achievement.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{unlockedAt ? "Débloqué" : "Progression"}</span>
                    <span>{progress} / {achievement.requirementValue}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progression : ${achievement.name}`}>
                    <div className={`h-full rounded-full ${unlockedAt ? "bg-amber-300" : "bg-emerald-500"}`} style={{ width: `${percent}%` }} />
                  </div>
                  {unlockedAt && <p className="mt-2 text-xs text-amber-200">Obtenu le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(unlockedAt))}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
