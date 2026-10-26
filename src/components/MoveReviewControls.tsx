import { ArrowLeftToLine, ArrowLeft, ArrowRight, ArrowRightToLine } from "lucide-react";

type MoveReviewControlsProps = {
  currentPly: number;
  moveCount: number;
  onSelectPly: (ply: number) => void;
};

export default function MoveReviewControls({
  currentPly,
  moveCount,
  onSelectPly,
}: MoveReviewControlsProps) {
  const reviewing = currentPly < moveCount;

  return (
    <div className="vc-move-review" aria-label="Navigation dans les coups">
      <div className="vc-move-review__buttons">
        <button type="button" onClick={() => onSelectPly(0)} disabled={currentPly === 0} aria-label="Revenir au début" title="Début">
          <ArrowLeftToLine size={16} />
        </button>
        <button type="button" onClick={() => onSelectPly(Math.max(0, currentPly - 1))} disabled={currentPly === 0} aria-label="Voir le coup précédent" title="Coup précédent">
          <ArrowLeft size={16} />
        </button>
        <button type="button" onClick={() => onSelectPly(Math.min(moveCount, currentPly + 1))} disabled={currentPly === moveCount} aria-label="Voir le coup suivant" title="Coup suivant">
          <ArrowRight size={16} />
        </button>
        <button type="button" onClick={() => onSelectPly(moveCount)} disabled={!reviewing} aria-label="Revenir à la position actuelle" title="Position actuelle">
          <ArrowRightToLine size={16} />
        </button>
      </div>
      <span aria-live="polite">
        {reviewing ? `Relecture · ${currentPly}/${moveCount}` : `Position actuelle · ${moveCount} coups`}
      </span>
    </div>
  );
}
