import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { AxiosError } from "axios";
import { Shield, UserPlus } from "lucide-react";
import axiosInstance from "../axios";

type ReportStatus = "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
type Report = {
  id: number;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reporterId: number;
  reportedUserId: number | null;
  gameId: number | null;
  messageId: number | null;
  createdAt: string;
};

function apiMessage(error: unknown) {
  return (error as AxiosError<{ message?: string }>).response?.data?.message
    ?? (error instanceof Error ? error.message : "La requête a échoué.");
}

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "ORGANIZER">("ORGANIZER");
  const [creatingUser, setCreatingUser] = useState(false);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const [pending, underReview] = await Promise.all([
        axiosInstance.get<Report[]>("/reports", { params: { status: "PENDING", limit: 100 } }),
        axiosInstance.get<Report[]>("/reports", { params: { status: "UNDER_REVIEW", limit: 100 } }),
      ]);
      setReports([...pending.data, ...underReview.data]);
      setError("");
    } catch (requestError) {
      setError(apiMessage(requestError));
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadReports);
  }, [loadReports]);

  const review = async (reportId: number, status: Exclude<ReportStatus, "PENDING">) => {
    setError("");
    setNotice("");
    try {
      await axiosInstance.patch(`/reports/${reportId}`, { status });
      setNotice("Le signalement a été mis à jour.");
      await loadReports();
    } catch (requestError) {
      setError(apiMessage(requestError));
    }
  };

  const createPrivilegedUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingUser(true);
    setError("");
    setNotice("");
    try {
      await axiosInstance.post("/auth/admin/users", { username, email, password, role });
      setNotice(`Le compte ${username} a été créé avec le rôle ${role === "ADMIN" ? "administrateur" : "organisateur"}.`);
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (requestError) {
      setError(apiMessage(requestError));
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <p className="eyebrow">ESPACE ADMINISTRATEUR</p>
        <h1 className="text-2xl font-semibold text-white">Administration</h1>
        <p className="mt-1 text-sm text-slate-400">Modérez les signalements et gérez les comptes privilégiés.</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-950/60 p-3 text-sm text-emerald-200">{notice}</p>}

      <form onSubmit={(event) => void createPrivilegedUser(event)} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-white"><UserPlus size={18} className="text-sky-300" /> Créer un compte privilégié</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-300">Pseudo
            <input required minLength={3} maxLength={30} value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">E-mail
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Mot de passe
            <input required type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">Rôle
            <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
              <option value="ORGANIZER">Organisateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </label>
        </div>
        <button disabled={creatingUser} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50">
          {creatingUser ? "Création…" : "Créer le compte"}
        </button>
      </form>

      <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-white"><Shield size={18} className="text-amber-200" /> Signalements à traiter</h2>
          <button type="button" onClick={() => void loadReports()} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Actualiser</button>
        </div>
        {loadingReports ? <p role="status" className="text-sm text-slate-400">Chargement des signalements…</p> : reports.length === 0 && !error ? (
          <p className="text-sm text-slate-400">Aucun signalement en attente.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="rounded-xl bg-slate-800/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">Signalement #{report.id} · {report.reason.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-slate-400">Auteur : {report.reporterId} · Compte visé : {report.reportedUserId ?? "—"} · Partie : {report.gameId ?? "—"} · Message : {report.messageId ?? "—"}</p>
                    {report.description && <p className="mt-2 text-sm text-slate-300">{report.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void review(report.id, "UNDER_REVIEW")} className="rounded-lg border border-sky-800 px-3 py-2 text-xs text-sky-200 hover:bg-sky-950/60">Prendre en charge</button>
                    <button type="button" onClick={() => void review(report.id, "RESOLVED")} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs text-white hover:bg-emerald-700">Résoudre</button>
                    <button type="button" onClick={() => void review(report.id, "REJECTED")} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700">Rejeter</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
