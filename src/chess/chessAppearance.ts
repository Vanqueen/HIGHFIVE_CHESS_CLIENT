export type BoardTheme = "forest" | "walnut" | "slate" | "midnight";
export type PieceStyle = "sculpted" | "classic";

export const BOARD_THEMES: Array<{
  id: BoardTheme;
  label: string;
  light: string;
  dark: string;
}> = [
  { id: "forest", label: "Forêt", light: "#e7d8b5", dark: "#62836c" },
  { id: "walnut", label: "Noyer", light: "#e4c9a2", dark: "#895d3d" },
  { id: "slate", label: "Ardoise", light: "#d8e0e8", dark: "#657a91" },
  { id: "midnight", label: "Minuit", light: "#c9c5df", dark: "#635c83" },
];
