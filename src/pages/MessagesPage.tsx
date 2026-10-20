import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, MessageSquare, Send, UserRound } from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "../axios";
import PlayerSearch, { type PlayerSummary } from "../components/PlayerSearch";
import { useSocket } from "../context/SocketContextValue";

type DirectConversation = {
  conversationId: number;
  otherUserId: number;
  otherUser: { id: number; username: string; avatarUrl: string | null };
  updatedAt: string;
};

type DirectMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: "TEXT" | "SYSTEM";
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

type Props = {
  initialFriend: { id: number; username: string } | null;
  onInitialFriendHandled: () => void;
};

type SocketAcknowledgement = { success: boolean; error?: string };

function getError(error: unknown) {
  const data = (error as AxiosError<{ message?: string }>).response?.data;
  return data?.message ?? (error instanceof Error ? error.message : "La requête a échoué.");
}

function isDirectMessage(value: unknown): value is DirectMessage {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "number" &&
      "senderId" in value &&
      typeof value.senderId === "number" &&
      "content" in value &&
      typeof value.content === "string",
  );
}

function formatMessageDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function MessagesPage({ initialFriend, onInitialFriendHandled }: Props) {
  const { socket, connected } = useSocket();
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [targetPlayer, setTargetPlayer] = useState<PlayerSummary | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activeFriend, setActiveFriend] = useState<DirectConversation["otherUser"] | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await axiosInstance.get<DirectConversation[]>("/conversations/me");
    setConversations(data);
    return data;
  }, []);

  useEffect(() => {
    void Promise.resolve()
      .then(refresh)
      .catch((requestError: unknown) => setError(getError(requestError)));
  }, [refresh]);

  const openDirectConversation = useCallback(async (player: PlayerSummary) => {
    const { data: conversation } = await axiosInstance.post<{ id: number }>(
      "/conversations/direct",
      { userId: player.id },
    );
    setActiveConversationId(conversation.id);
    setActiveFriend({
      id: player.id,
      username: player.username,
      avatarUrl: player.avatarUrl,
    });
    setMessages([]);
    setHasOlderMessages(true);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (!initialFriend) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      setError("");
      try {
        await openDirectConversation({
          id: initialFriend.id,
          username: initialFriend.username,
          avatarUrl: null,
        });
      } catch (requestError) {
        if (!cancelled) setError(getError(requestError));
      } finally {
        if (!cancelled) {
          setLoading(false);
          onInitialFriendHandled();
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialFriend, openDirectConversation, onInitialFriendHandled]);

  const selectConversation = (conversation: DirectConversation) => {
    setActiveConversationId(conversation.conversationId);
    setActiveFriend(conversation.otherUser);
    setMessages([]);
    setHasOlderMessages(true);
    setError("");
  };

  useEffect(() => {
    if (activeConversationId === null) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingMessages(true);
      try {
        const { data } = await axiosInstance.get<DirectMessage[]>(
          `/conversations/${activeConversationId}/messages`,
          { params: { limit: 50 } },
        );
        if (!cancelled) {
          setMessages(data);
          setHasOlderMessages(data.length === 50);
        }
      } catch (requestError) {
        if (!cancelled) setError(getError(requestError));
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!socket || !connected || activeConversationId === null) return;
    const conversationId = activeConversationId;
    const onNewMessage = (event: unknown) => {
      if (!event || typeof event !== "object" || !("message" in event)) return;
      const incoming = event.message;
      if (!isDirectMessage(incoming) || incoming.conversationId !== conversationId) return;
      setMessages((current) => current.some((item) => item.id === incoming.id)
        ? current
        : [...current, incoming]);
    };
    const onMessageEdited = (event: unknown) => {
      if (!event || typeof event !== "object" || !("messageId" in event) ||
        !("newContent" in event) || typeof event.messageId !== "number" ||
        typeof event.newContent !== "string") return;
      setMessages((current) => current.map((message) =>
        message.id === event.messageId
          ? {
            ...message,
            content: event.newContent as string,
            editedAt: "editedAt" in event && typeof event.editedAt === "string"
              ? event.editedAt
              : message.editedAt,
          }
          : message
      ));
    };
    const onMessageDeleted = (event: unknown) => {
      if (!event || typeof event !== "object" || !("messageId" in event) ||
        typeof event.messageId !== "number") return;
      setMessages((current) => current.filter((message) => message.id !== event.messageId));
    };
    const onConversationError = (acknowledgement: SocketAcknowledgement) => {
      if (!acknowledgement.success) setError(acknowledgement.error ?? "La conversation est inaccessible.");
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:edited", onMessageEdited);
    socket.on("message:deleted", onMessageDeleted);
    socket.emit("conversation:join", { conversationId }, onConversationError);
    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:edited", onMessageEdited);
      socket.off("message:deleted", onMessageDeleted);
      socket.emit("conversation:leave", { conversationId });
    };
  }, [socket, connected, activeConversationId]);

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeConversationId === null || !content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.post<DirectMessage>(
        `/conversations/${activeConversationId}/messages`,
        { content },
      );
      setMessages((current) => current.some((message) => message.id === data.id)
        ? current
        : [...current, data]);
      setContent("");
      await refresh();
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const loadOlderMessages = async () => {
    const oldest = messages[0];
    if (activeConversationId === null || !oldest) return;
    setLoadingOlder(true);
    setError("");
    try {
      const { data } = await axiosInstance.get<DirectMessage[]>(
        `/conversations/${activeConversationId}/messages`,
        { params: { limit: 50, beforeId: oldest.id } },
      );
      setMessages((current) => {
        const knownIds = new Set(current.map((message) => message.id));
        return [...data.filter((message) => !knownIds.has(message.id)), ...current];
      });
      setHasOlderMessages(data.length === 50);
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoadingOlder(false);
    }
  };

  const openSelectedPlayer = async () => {
    if (!targetPlayer) {
      setError("Recherchez puis sélectionnez un joueur.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await openDirectConversation(targetPlayer);
      setNotice(`Conversation avec ${targetPlayer.username} ouverte.`);
      setTargetPlayer(null);
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
        <h1 className="text-2xl font-semibold text-white">Messagerie</h1>
      </header>
      {error && <p role="alert" className="rounded-lg bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-950/60 p-3 text-sm text-emerald-200">{notice}</p>}

      <section className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 md:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-b border-slate-700 p-4 md:border-b-0 md:border-r">
          <h2 className="mb-3 font-semibold text-white">Conversations directes</h2>
          <div className="mb-4 space-y-2">
            <PlayerSearch onSelect={setTargetPlayer} />
            <button
              type="button"
              disabled={loading || !targetPlayer}
              onClick={() => void openSelectedPlayer()}
              className="w-full rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Ouvrir une conversation
            </button>
          </div>
          {conversations.length === 0 ? (
            <p className="py-5 text-sm text-slate-500">Aucune conversation directe pour le moment.</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conversation) => (
                <li key={conversation.conversationId}>
                  <button
                    type="button"
                    onClick={() => selectConversation(conversation)}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-800 ${
                      activeConversationId === conversation.conversationId ? "bg-slate-800" : ""
                    }`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-700 text-emerald-200">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-slate-100">
                        {conversation.otherUser.username}
                      </strong>
                      <small className="text-slate-500">
                        {formatMessageDate(conversation.updatedAt)}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="flex min-h-[28rem] min-w-0 flex-col">
          {activeConversationId === null ? (
            <div className="grid flex-1 place-items-center p-6 text-center">
              <div>
                <MessageSquare className="mx-auto h-9 w-9 text-slate-600" />
                <p className="mt-3 text-sm text-slate-400">Sélectionnez un ami pour ouvrir votre conversation.</p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-slate-700 p-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveConversationId(null);
                    setActiveFriend(null);
                  }}
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-800 md:hidden"
                  aria-label="Retour aux conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-emerald-200">
                  <UserRound className="h-4 w-4" />
                </span>
                <strong className="text-sm text-slate-100">{activeFriend?.username ?? "Conversation"}</strong>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {hasOlderMessages && messages.length > 0 && (
                  <button
                    type="button"
                    disabled={loadingOlder}
                    onClick={() => void loadOlderMessages()}
                    className="mx-auto flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loadingOlder && <LoaderCircle className="h-3 w-3 animate-spin" />}
                    Charger les anciens messages
                  </button>
                )}
                {loadingMessages ? (
                  <p className="py-8 text-center text-sm text-slate-500">Chargement des messages…</p>
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Aucun message. Dites bonjour !</p>
                ) : messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === activeFriend?.id ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.senderId === activeFriend?.id
                        ? "bg-slate-800 text-slate-100"
                        : "bg-emerald-900/80 text-emerald-50"
                    }`}>
                      <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                      <small className="mt-1 block text-right text-[10px] opacity-60">
                        {formatMessageDate(message.createdAt)}{message.editedAt ? " · modifié" : ""}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={(event) => void sendMessage(event)} className="flex gap-2 border-t border-slate-700 p-3">
                <input
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={2000}
                  placeholder={`Écrire à ${activeFriend?.username ?? "votre ami"}…`}
                  aria-label="Votre message"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-700"
                />
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  aria-label="Envoyer le message"
                  className="rounded-lg bg-emerald-800 p-2.5 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
