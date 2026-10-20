import { useCallback, useEffect, useState } from "react";
import { MessageSquare, UserRound } from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "../axios";
import PlayerSearch, { type PlayerSummary } from "../components/PlayerSearch";

type DirectConversation = {
  conversationId: number;
  otherUserId: number;
  otherUser: { id: number; username: string; avatarUrl: string | null };
  createdAt?: string;
};

function getError(error: unknown) {
  const data = (error as AxiosError<{ message?: string }>).response?.data;
  return data?.message ?? (error instanceof Error ? error.message : "La requête a échoué.");
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [targetPlayer, setTargetPlayer] = useState<PlayerSummary | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<DirectConversation[]>("/conversations/me");
      setConversations(data);
      setError("");
    } catch (requestError) {
      setError(getError(requestError));
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const openConversation = async () => {
    if (!targetPlayer) {
      setError("Recherchez puis sélectionnez un joueur.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await axiosInstance.post("/conversations/direct", { userId: targetPlayer.id });
      setNotice("Conversation directe créée ou déjà existante.");
      setTargetPlayer(null);
      await refresh();
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">ESPACE SOCIAL</p>
        <h1 className="text-2xl font-semibold text-white">Conversations</h1>
      </header>
      {error && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-950/60 p-3 text-sm text-emerald-200">{notice}</p>}

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="mb-2 font-semibold text-white">Ouvrir une conversation directe</h2>
        <p className="mb-3 text-sm text-slate-400">Cette action crée l’espace de conversation. L’envoi et la lecture des messages privés ne sont pas encore disponibles côté serveur.</p>
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-55 flex-1">
            <PlayerSearch onSelect={setTargetPlayer} />
          </div>
          <button disabled={loading || !targetPlayer} onClick={() => void openConversation()} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-emerald-700 disabled:opacity-50">Ouvrir</button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="mb-4 font-semibold text-white">Conversations directes ({conversations.length})</h2>
        {conversations.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm text-slate-300">Aucune conversation directe pour le moment.</p>
            <p className="mt-1 text-xs text-slate-500">Les utilisateurs bloqués ne sont pas inclus.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation) => (
              <li key={conversation.conversationId} className="flex items-center gap-3 rounded-xl bg-slate-800/70 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-700 text-emerald-200"><UserRound className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-100">{conversation.otherUser.username}</strong>
                  <small className="text-slate-500">Compte {conversation.otherUserId}</small>
                </span>
                <span className="rounded-full bg-slate-700 px-2 py-1 text-[10px] uppercase text-slate-400">Messages privés indisponibles</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
