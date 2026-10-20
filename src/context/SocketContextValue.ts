import { createContext, useContext } from "react";
import type { newSocket } from "../socket";
import type { User } from "../types/User";

export type SocketContextValue = {
  socket: typeof newSocket | null;
  connected: boolean;
  onlineUsers: string[];
  user: User | null;
};

export const SocketContext = createContext<SocketContextValue | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
