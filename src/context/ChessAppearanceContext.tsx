import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BOARD_THEMES, type BoardTheme, type PieceStyle } from "../chess/chessAppearance";

const STORAGE_KEY = "chessarena-board-appearance";
const DEFAULT_PREFERENCES: ChessAppearance = { boardTheme: "forest", pieceStyle: "realistic" };
const PIECE_STYLES: PieceStyle[] = ["realistic", "sculpted", "classic"];

type ChessAppearance = { boardTheme: BoardTheme; pieceStyle: PieceStyle };
type ChessAppearanceContextValue = ChessAppearance & {
  setBoardTheme: (theme: BoardTheme) => void;
  setPieceStyle: (style: PieceStyle) => void;
};

const ChessAppearanceContext = createContext<ChessAppearanceContextValue | null>(null);

function isBoardTheme(value: unknown): value is BoardTheme {
  return BOARD_THEMES.some((theme) => theme.id === value);
}

function isPieceStyle(value: unknown): value is PieceStyle {
  return PIECE_STYLES.includes(value as PieceStyle);
}

function readPreferences(): ChessAppearance {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PREFERENCES;
    const preferences = parsed as Record<string, unknown>;
    return {
      boardTheme: isBoardTheme(preferences.boardTheme) ? preferences.boardTheme : DEFAULT_PREFERENCES.boardTheme,
      pieceStyle: isPieceStyle(preferences.pieceStyle) ? preferences.pieceStyle : DEFAULT_PREFERENCES.pieceStyle,
    };
  } catch (error) {
    console.warn("Impossible de lire les préférences de l’échiquier.", error);
    return DEFAULT_PREFERENCES;
  }
}

export function ChessAppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState(readPreferences);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch (error) {
      console.warn("Impossible d’enregistrer les préférences de l’échiquier.", error);
    }
  }, [appearance]);

  return (
    <ChessAppearanceContext.Provider
      value={{
        ...appearance,
        setBoardTheme: (boardTheme) => setAppearance((current) => ({ ...current, boardTheme })),
        setPieceStyle: (pieceStyle) => setAppearance((current) => ({ ...current, pieceStyle })),
      }}
    >
      {children}
    </ChessAppearanceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChessAppearance() {
  const context = useContext(ChessAppearanceContext);
  if (!context) {
    throw new Error("useChessAppearance doit être utilisé dans ChessAppearanceProvider.");
  }
  return context;
}
