import { useCallback, useEffect, useState } from "react";
import { Check, MessageSquare, Shield, ShieldOff, UserPlus, UserRound, UserX } from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "../axios";
import { useAuth } from "../context/AuthContext";
import PlayerSearch, { type PlayerSummary } from "../components/PlayerSearch";

type Friendship = {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: string;
  createdAt: string;
};

type Block = {
  id: number;
  blockerId: number;
  blockedUserId: number;
  createdAt: string;
};

type Props = { onOpenMessages: () => void };

function apiMessage(error: unknown) {
  const data = (error as AxiosError<{ message?: string }>).response?.data;
  return data?.message ?? (error instanceof Error ? error.message : "L’action a échoué.");
}

export default function UsersPage({ onOpenMessages }: Props) {
  const { profile } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [targetPlayer, setTargetPlayer] = useState<PlayerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [{ data: friendshipData }, { data: blockData }] = await Promise.all([
        axiosInstance.get<Friendship[]>("/friendships/me"),
        axiosInstance.get<Block[]>("/blocked-users/me"),
      ]);
      setFriendships(friendshipData);
      setBlocks(blockData);
      setError("");
    } catch (requestError) {
      setError(apiMessage(requestError));
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const actOnUser = async (action: "friend" | "block") => {
    if (!targetPlayer || targetPlayer.id === Number(profile?.id)) {
      setError("Recherchez puis sélectionnez un autre joueur.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (action === "friend") {
        await axiosInstance.post(`/friendships/${targetPlayer.id}`);
        setNotice(`Demande d’amitié envoyée à ${targetPlayer.username}.`);
      } else {
        await axiosInstance.post(`/blocked-users/${targetPlayer.id}`);
        setNotice("Compte bloqué. Les amitiés existantes sont supprimées.");
      }
      setTargetPlayer(null);
      await refresh();
    } catch (requestError) {
      setError(apiMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const friendshipAction = async (friendship: Friendship, action: "accept" | "reject" | "delete") => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (action === "delete") await axiosInstance.delete(`/friendships/${friendship.id}`);
      else await axiosInstance.post(`/friendships/${friendship.id}/${action}`);
      setNotice(action === "accept" ? "Demande acceptée." : action === "reject" ? "Demande refusée." : "Amitié supprimée.");
      await refresh();
    } catch (requestError) {
      setError(apiMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const unblock = async (userId: number) => {
    setLoading(true);
    setError("");
    try {
      await axiosInstance.delete(`/blocked-users/${userId}`);
      setNotice(`Le blocage du compte ${userId} a été retiré.`);
      await refresh();
    } catch (requestError) {
      setError(apiMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const incoming = friendships.filter(
    (item) => item.status === "PENDING" && item.addresseeId === Number(profile?.id),
  );
  const outgoing = friendships.filter(
    (item) => item.status === "PENDING" && item.requesterId === Number(profile?.id),
  );
  const accepted = friendships.filter((item) => item.status === "ACCEPTED");

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">COMMUNAUTÉ</p>
        <h1 className="text-xl font-semibold text-white">Amis et blocages</h1>
        <p className="mt-1 text-sm text-slate-400">Gérez vos relations par identifiant de compte.</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-950/60 p-3 text-sm text-emerald-200">{notice}</p>}

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-white"><UserPlus className="h-4 w-4 text-emerald-300" /> Ajouter ou bloquer un joueur</h2>
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-55 flex-1">
            <PlayerSearch onSelect={setTargetPlayer} />
          </div>
          <button disabled={loading || !targetPlayer} onClick={() => void actOnUser("friend")} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white! hover:bg-emerald-700 disabled:opacity-50">Demander en ami</button>
          <button disabled={loading || !targetPlayer} onClick={() => void actOnUser("block")} className="rounded-lg border border-rose-900/70 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/50 disabled:opacity-50">Bloquer</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Recherchez un joueur par son pseudonyme et sélectionnez le bon compte.</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-4 font-semibold text-white">Demandes reçues ({incoming.length})</h2>
          {incoming.length === 0 ? <p className="text-sm text-slate-500">Aucune demande en attente.</p> : (
            <ul className="space-y-2">
              {incoming.map((friendship) => <li key={friendship.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-800/70 p-3">
                <span className="flex items-center gap-2 text-sm text-slate-200"><UserRound className="h-4 w-4 text-slate-400" /> Compte {friendship.requesterId}</span>
                <span className="flex gap-2">
                  <button disabled={loading} onClick={() => void friendshipAction(friendship, "accept")} aria-label="Accepter la demande" className="rounded-md bg-emerald-800 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" /></button>
                  <button disabled={loading} onClick={() => void friendshipAction(friendship, "reject")} aria-label="Refuser la demande" className="rounded-md bg-slate-700 p-2 text-slate-200 hover:bg-slate-600 disabled:opacity-50"><UserX className="h-4 w-4" /></button>
                </span>
              </li>)}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-4 font-semibold text-white">Demandes envoyées ({outgoing.length})</h2>
          {outgoing.length === 0 ? <p className="text-sm text-slate-500">Aucune demande envoyée en attente.</p> : (
            <ul className="space-y-2">
              {outgoing.map((friendship) => <li key={friendship.id} className="flex items-center justify-between rounded-xl bg-slate-800/70 p-3 text-sm text-slate-200"><span>Compte {friendship.addresseeId}</span><span className="text-xs text-slate-500">En attente</span></li>)}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-4 font-semibold text-white">Amis ({accepted.length})</h2>
          {accepted.length === 0 ? <p className="text-sm text-slate-500">Vos amitiés acceptées apparaîtront ici.</p> : (
            <ul className="space-y-2">
              {accepted.map((friendship) => {
                const friendId = friendship.requesterId === Number(profile?.id) ? friendship.addresseeId : friendship.requesterId;
                return <li key={friendship.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-800/70 p-3">
                  <span className="flex items-center gap-2 text-sm text-slate-200"><UserRound className="h-4 w-4 text-emerald-300" /> Compte {friendId}</span>
                  <div className="flex gap-2">
                    <button onClick={onOpenMessages} className="flex items-center gap-1 rounded-md bg-slate-700 px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-600"><MessageSquare className="h-3.5 w-3.5" /> Conversation</button>
                    <button disabled={loading} onClick={() => void friendshipAction(friendship, "delete")} className="rounded-md p-2 text-slate-400 hover:bg-rose-950/50 hover:text-rose-300 disabled:opacity-50" aria-label="Supprimer l’amitié"><UserX className="h-4 w-4" /></button>
                  </div>
                </li>;
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white"><Shield className="h-4 w-4 text-rose-300" /> Comptes bloqués ({blocks.length})</h2>
          {blocks.length === 0 ? <p className="text-sm text-slate-500">Aucun compte bloqué.</p> : (
            <ul className="space-y-2">
              {blocks.map((block) => <li key={block.id} className="flex items-center justify-between rounded-xl bg-slate-800/70 p-3">
                <span className="text-sm text-slate-200">Compte {block.blockedUserId}</span>
                <button disabled={loading} onClick={() => void unblock(block.blockedUserId)} className="flex items-center gap-1 rounded-md px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"><ShieldOff className="h-3.5 w-3.5" /> Débloquer</button>
              </li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
