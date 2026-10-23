export type ColorPreference = "WHITE" | "BLACK" | "RANDOM";

type ColorPreferenceSelectorProps = {
  value: ColorPreference;
  onChange: (value: ColorPreference) => void;
};

const OPTIONS: Array<{
  value: ColorPreference;
  label: string;
  piece: string;
}> = [
  { value: "WHITE", label: "Blancs", piece: "♔" },
  { value: "RANDOM", label: "Couleur aléatoire", piece: "♔♚" },
  { value: "BLACK", label: "Noirs", piece: "♚" },
];

export default function ColorPreferenceSelector({
  value,
  onChange,
}: ColorPreferenceSelectorProps) {
  return (
    <fieldset className="vc-color-selector">
      <legend>Votre couleur</legend>
      <div className="vc-color-selector__options">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`vc-color-selector__option${value === option.value ? " is-selected" : ""}`}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
          >
            <span className="vc-color-selector__piece" aria-hidden="true">{option.piece}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
