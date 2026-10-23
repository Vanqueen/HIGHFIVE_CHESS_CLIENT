import { createContext, useContext, useEffect, useState } from "react";
import type { Notification } from "../types/Notification";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContextValue";

export type Tab =
  | "home"
  | "profile"
  | "play"
  | "computer"
  | "games"
  | "tournaments"
  | "problems"
  | "learn"
  | "board-editor"
  | "watch"
  | "rankings"
  | "friends"
  | "messages"
  | "notifications"
  | "users"
  | "achievements"
  | "organizer"
  | "admin";

type NavigationContextType = {
  tab: Tab;
  setTab: (tab: Tab) => void;
  notifications: Notification[];
  markAllRead: () => void;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

// Context hooks are intentionally colocated with their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}

function normalizeCreatedAt(value: unknown) {
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string") {
    date = new Date(value);
  } else if (
    value &&
    typeof value === "object" &&
    "epochMilliseconds" in value &&
    typeof value.epochMilliseconds === "number"
  ) {
    date = new Date(value.epochMilliseconds);
  } else {
    return new Date().toISOString();
  }
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { socket } = useSocket();
  const [tab, setTab] = useState<Tab>(() =>
    window.location.pathname === "/computer"
      ? "computer"
      : /^\/(?:challenge|challenge-link|guest-game)\//.test(window.location.pathname)
      ? "play"
      : "home",
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket) return;
    const onNotification = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      const n = value as {
        id?: number | string;
        type?: string;
        title?: string;
        content?: string | null;
        message?: string | null;
        data?: Record<string, unknown> | null;
        createdAt?: unknown;
      };
      if (!n.title || !n.type) return;
      const normalized: Notification = {
        id: String(n.id ?? `${Date.now()}-${Math.random()}`),
        user_id: profile?.id ?? "",
        type: n.type.toLowerCase(),
        title: n.title,
        message: n.content ?? n.message ?? null,
        resource_id: null,
        data: n.data ?? null,
        read_status: false,
        created_at: normalizeCreatedAt(n.createdAt),
      };
      setNotifications((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)]);
    };
    socket.on("notification", onNotification);
    return () => { socket.off("notification", onNotification); };
  }, [socket, profile?.id]);

  const markAllRead = () =>
    setNotifications((current) => current.map((n) => ({ ...n, read_status: true })));

  return (
    <NavigationContext.Provider value={{ tab, setTab, notifications, markAllRead }}>
      {children}
    </NavigationContext.Provider>
  );
}
