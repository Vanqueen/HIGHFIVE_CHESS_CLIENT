import { Check, ChevronDown, Clock3, Crown } from "lucide-react";

export type TimeControlPreset = {
  initialTimeSeconds: number;
  incrementSeconds: number;
  label: string;
};

type GameSetupControlsProps = {
  initialTimeSeconds: number;
  incrementSeconds: number;
  onTimeControlChange: (initialTimeSeconds: number, incrementSeconds: number) => void;
  rated: boolean;
  onRatedChange?: (rated: boolean) => void;
  ratedAvailable: boolean;
  ratedUnavailableReason: string;
  presets?: TimeControlPreset[];
};

const DEFAULT_PRESETS: TimeControlPreset[] = [
  { initialTimeSeconds: 60, incrementSeconds: 0, label: "1 + 0" },
  { initialTimeSeconds: 180, incrementSeconds: 0, label: "3 + 0" },
  { initialTimeSeconds: 300, incrementSeconds: 0, label: "5 + 0" },
  { initialTimeSeconds: 600, incrementSeconds: 0, label: "10 + 0" },
  { initialTimeSeconds: 900, incrementSeconds: 10, label: "15 + 10" },
];

export default function GameSetupControls({
  initialTimeSeconds,
  incrementSeconds,
  onTimeControlChange,
  rated,
  onRatedChange,
  ratedAvailable,
  ratedUnavailableReason,
  presets = DEFAULT_PRESETS,
}: GameSetupControlsProps) {
  const unlimited = initialTimeSeconds === 0;

  return (
    <div className="vc-game-setup-controls">
      <div className="vc-game-setup-variant">
        <Crown size={17} aria-hidden="true" />
        <strong>Standard</strong>
        <span>Règles classiques des échecs</span>
        <ChevronDown size={15} aria-hidden="true" />
      </div>

      <div className="vc-game-setup-tabs" role="group" aria-label="Cadence">
        <button
          type="button"
          className={unlimited ? "is-active" : ""}
          aria-pressed={unlimited}
          onClick={() => onTimeControlChange(0, 0)}
        >
          Illimité
        </button>
        <button
          type="button"
          className={!unlimited ? "is-active" : ""}
          aria-pressed={!unlimited}
          onClick={() => {
            if (unlimited) onTimeControlChange(300, 0);
          }}
        >
          <Clock3 size={14} aria-hidden="true" /> Temps réel
        </button>
        <button
          type="button"
          className="is-unavailable"
          disabled
          title="Le jeu par correspondance n’est pas encore disponible."
        >
          Correspondance
        </button>
      </div>

      <p className="vc-game-setup-caption">
        {unlimited
          ? "Prenez tout le temps dont vous avez besoin."
          : "Choisissez une cadence avec une horloge en temps réel."}
      </p>

      {!unlimited && (
        <fieldset className="vc-game-setup-time">
          <legend>Temps de jeu</legend>
          <div className="vc-game-setup-time__options">
            {presets.map((preset) => {
              const selected = initialTimeSeconds === preset.initialTimeSeconds &&
                incrementSeconds === preset.incrementSeconds;
              return (
                <button
                  type="button"
                  key={preset.label}
                  className={selected ? "is-selected" : ""}
                  aria-pressed={selected}
                  onClick={() => onTimeControlChange(
                    preset.initialTimeSeconds,
                    preset.incrementSeconds,
                  )}
                >
                  {preset.label}
                  {selected && <Check size={13} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="vc-game-setup-mode">
        <legend>Mode de jeu</legend>
        <div className="vc-game-setup-mode__options" role="group" aria-label="Mode de jeu">
          <button
            type="button"
            className={!rated ? "is-selected" : ""}
            aria-pressed={!rated}
            onClick={() => onRatedChange?.(false)}
          >
            Amical
          </button>
          <button
            type="button"
            className={rated ? "is-selected" : ""}
            aria-pressed={rated}
            disabled={!ratedAvailable}
            title={!ratedAvailable ? ratedUnavailableReason : undefined}
            onClick={() => onRatedChange?.(true)}
          >
            Classé
          </button>
        </div>
        {!ratedAvailable && <p>{ratedUnavailableReason}</p>}
      </fieldset>
    </div>
  );
}
