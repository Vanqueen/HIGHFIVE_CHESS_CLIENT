import { Circle, Shuffle } from "lucide-react";

export type ColorPreference = "WHITE" | "BLACK" | "RANDOM";

type ColorPreferenceSelectorProps = {
  value: ColorPreference;
  onChange: (value: ColorPreference) => void;
};

const OPTIONS: Array<{
  value: ColorPreference;
  label: string;
  icon: typeof Circle;
}> = [
  { value: "WHITE", label: "Blancs", icon: Circle },
  { value: "RANDOM", label: "Couleur aléatoire", icon: Shuffle },
  { value: "BLACK", label: "Noirs", icon: Circle },
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
            <option.icon
              className={`vc-color-selector__icon vc-color-selector__icon--${option.value.toLowerCase()}`}
              size={25}
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
