export type GuestGameSession = {
  gameId: number;
  participantId: number;
  color: "WHITE" | "BLACK";
  token: string;
  game: unknown;
};

const GUEST_SESSION_KEY = "guestGameSession";
const GUEST_SESSION_CHANGED_EVENT = "guest-game-session-changed";

export function readGuestGameSession(): GuestGameSession | null {
  const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
  if (!stored) return null;

  try {
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== "object") return null;
    const session = value as Partial<GuestGameSession>;
    if (
      !Number.isSafeInteger(session.gameId) ||
      !Number.isSafeInteger(session.participantId) ||
      (session.color !== "WHITE" && session.color !== "BLACK") ||
      typeof session.token !== "string" ||
      !session.token ||
      !session.game
    ) return null;
    return session as GuestGameSession;
  } catch {
    return null;
  }
}

export function saveGuestGameSession(session: GuestGameSession) {
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(GUEST_SESSION_CHANGED_EVENT));
}

export function clearGuestGameSession() {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
  window.dispatchEvent(new Event(GUEST_SESSION_CHANGED_EVENT));
}

export function guestGameSessionChangedEvent() {
  return GUEST_SESSION_CHANGED_EVENT;
}
