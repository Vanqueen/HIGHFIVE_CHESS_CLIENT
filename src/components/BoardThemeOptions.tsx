import { BOARD_THEMES } from "../chess/chessAppearance";
import { useChessAppearance } from "../context/ChessAppearanceContext";

export default function BoardThemeOptions() {
  const { boardTheme, setBoardTheme } = useChessAppearance();

  return (
    <div className="vc-guest-board-themes__options" role="group" aria-label="Thème du plateau">
      {BOARD_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={`vc-guest-board-theme${boardTheme === theme.id ? " is-selected" : ""}`}
          aria-pressed={boardTheme === theme.id}
          onClick={() => setBoardTheme(theme.id)}
        >
          <span className="vc-guest-board-theme__swatch" aria-hidden="true">
            <i style={{ backgroundColor: theme.light }} />
            <i style={{ backgroundColor: theme.dark }} />
            <i style={{ backgroundColor: theme.dark }} />
            <i style={{ backgroundColor: theme.light }} />
          </span>
          <span>{theme.label}</span>
        </button>
      ))}
    </div>
  );
}
