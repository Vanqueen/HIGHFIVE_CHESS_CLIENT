import { useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import {
  useChessAppearance,
} from "../context/ChessAppearanceContext";
import { BOARD_THEMES, type PieceStyle } from "../chess/chessAppearance";

const PIECE_STYLES: Array<{ id: PieceStyle; label: string }> = [
  { id: "classic", label: "Classiques" },
  { id: "sculpted", label: "Sculptées" },
];

export default function ChessBoardPreferences() {
  const [open, setOpen] = useState(false);
  const { boardTheme, pieceStyle, setBoardTheme, setPieceStyle } = useChessAppearance();

  return (
    <section className="vc-board-preferences">
      <button
        type="button"
        className="vc-board-preferences__toggle"
        aria-expanded={open}
        aria-controls="vc-board-preferences-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Apparence de l’échiquier
        <span>{BOARD_THEMES.find((theme) => theme.id === boardTheme)?.label} · {PIECE_STYLES.find((style) => style.id === pieceStyle)?.label}</span>
      </button>

      {open && (
        <div className="vc-board-preferences__panel" id="vc-board-preferences-panel">
          <fieldset>
            <legend>Style du plateau</legend>
            <div className="vc-board-preferences__themes">
              {BOARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className={`vc-board-preferences__theme${boardTheme === theme.id ? " is-selected" : ""}`}
                  aria-pressed={boardTheme === theme.id}
                  onClick={() => setBoardTheme(theme.id)}
                >
                  <span className="vc-board-preferences__swatch" aria-hidden="true">
                    <i style={{ backgroundColor: theme.light }} />
                    <i style={{ backgroundColor: theme.dark }} />
                    <i style={{ backgroundColor: theme.dark }} />
                    <i style={{ backgroundColor: theme.light }} />
                  </span>
                  <span>{theme.label}</span>
                  {boardTheme === theme.id && <Check size={14} aria-label="Sélectionné" />}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Style des pièces</legend>
            <div className="vc-board-preferences__pieces">
              {PIECE_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={pieceStyle === style.id ? "is-selected" : ""}
                  aria-pressed={pieceStyle === style.id}
                  onClick={() => setPieceStyle(style.id)}
                >
                  <span aria-hidden="true">{style.id === "sculpted" ? "♔" : "♚"}</span>
                  {style.label}
                  {pieceStyle === style.id && <Check size={14} aria-label="Sélectionné" />}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </section>
  );
}
