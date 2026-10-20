import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { newSocket } from "../socket";
import axiosInstance from "../axios";
import { useAuth } from "./AuthContext";
import { SocketContext } from "./SocketContextValue";
import {
  guestGameSessionChangedEvent,
  readGuestGameSession,
  type GuestGameSession,
} from "../guestSession";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [guestSession, setGuestSession] = useState<GuestGameSession | null>(
    readGuestGameSession,
  );
  const { accessToken, user } = useAuth();
  const userId = user?.id ?? null;
  const isAuthenticated = Boolean(accessToken && userId);
  const hasSocketCredentials = isAuthenticated || Boolean(guestSession);
  const previousCredentials = useRef({ accessToken, userId, guestToken: guestSession?.token });
  const authRecoveryToken = useRef<string | null>(null);

  useEffect(() => {
    newSocket.auth = guestSession
      ? { guestSessionToken: guestSession.token }
      : accessToken && userId
        ? { accessToken }
        : {};
    authRecoveryToken.current = null;

    const previous = previousCredentials.current;
    const credentialsChanged = previous.accessToken !== accessToken ||
      previous.userId !== userId ||
      previous.guestToken !== guestSession?.token;
    previousCredentials.current = { accessToken, userId, guestToken: guestSession?.token };

    if (credentialsChanged && newSocket.connected) {
      newSocket.disconnect();
      newSocket.connect();
    }
  }, [accessToken, userId, guestSession]);

  useEffect(() => {
    const syncGuestSession = () => setGuestSession(readGuestGameSession());
    const eventName = guestGameSessionChangedEvent();
    window.addEventListener(eventName, syncGuestSession);
    return () => window.removeEventListener(eventName, syncGuestSession);
  }, []);

  useEffect(() => {
    if (!hasSocketCredentials) {
      newSocket.disconnect();
      return;
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setOnlineUsers([]);
    };
    const onConnectError = (error: Error) => {
      setConnected(false);
      setOnlineUsers([]);
      if (error.message === "Authentification requise.") {
        if (!isAuthenticated) return;
        const currentToken = localStorage.getItem("accessToken");
        if (currentToken && authRecoveryToken.current !== currentToken) {
          authRecoveryToken.current = currentToken;
          void axiosInstance.get("/users/me").catch((recoveryError: unknown) => {
            if (!axios.isAxiosError(recoveryError) || recoveryError.response?.status !== 401) {
              console.error("Impossible de rétablir la session du socket :", recoveryError);
            }
          });
        }
        return;
      }
      console.error("Socket connection error:", error.message);
    };
    const onOnlineUsers = (users: string[]) => setOnlineUsers(users);

    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("connect_error", onConnectError);
    newSocket.on("getOnlineUsers", onOnlineUsers);
    if (!newSocket.connected) newSocket.connect();

    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("connect_error", onConnectError);
      newSocket.off("getOnlineUsers", onOnlineUsers);
      newSocket.disconnect();
    };
  }, [hasSocketCredentials, isAuthenticated, userId]);

  const value = {
    socket: hasSocketCredentials ? newSocket : null,
    connected: hasSocketCredentials && connected,
    onlineUsers: isAuthenticated ? onlineUsers : [],
    user,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
