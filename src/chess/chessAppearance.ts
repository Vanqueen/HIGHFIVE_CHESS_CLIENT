export type BoardTheme =
  | "forest"
  | "walnut"
  | "sand"
  | "slate"
  | "midnight"
  | "ocean"
  | "rose"
  | "amber"
  | "lavender"
  | "monochrome"
  | "blackwhite"
  | "cherry"
  | "teal"
  | "indigo"
  | "lime";
export type PieceStyle = "realistic" | "sculpted" | "classic";

export const BOARD_THEMES: Array<{
  id: BoardTheme;
  label: string;
  light: string;
  dark: string;
}> = [
  { id: "forest", label: "Forêt", light: "#e7d8b5", dark: "#62836c" },
  { id: "walnut", label: "Noyer", light: "#e4c9a2", dark: "#895d3d" },
  { id: "sand", label: "Sable", light: "#ebecd0", dark: "#b68860" },
  { id: "slate", label: "Ardoise", light: "#d8e0e8", dark: "#657a91" },
  { id: "midnight", label: "Minuit", light: "#c9c5df", dark: "#635c83" },
  { id: "ocean", label: "Océan", light: "#e0f0f4", dark: "#4f8299" },
  { id: "rose", label: "Rose", light: "#f3dfe8", dark: "#ad6680" },
  { id: "amber", label: "Ambre", light: "#f5e8c9", dark: "#bd8144" },
  { id: "lavender", label: "Lavande", light: "#eee8f8", dark: "#8170a6" },
  { id: "monochrome", label: "Gris", light: "#e5e7e8", dark: "#737b80" },
  { id: "blackwhite", label: "Noir & blanc", light: "#f5f5f2", dark: "#34383d" },
  { id: "cherry", label: "Cerise", light: "#f6e3de", dark: "#b8564d" },
  { id: "teal", label: "Turquoise", light: "#e0f1ec", dark: "#438779" },
  { id: "indigo", label: "Indigo", light: "#e6e9f8", dark: "#5965a5" },
  { id: "lime", label: "Tilleul", light: "#eff3d8", dark: "#829744" },
];
