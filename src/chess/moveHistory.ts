import { Chess, type Square } from "chess.js";

export type MoveForReview = {
  from?: string;
  to?: string;
  san?: string | null;
};

export type MovePosition = {
  fen: string;
  lastMove: { from: Square; to: Square } | null;
};

export function buildMovePositions(moves: MoveForReview[]) {
  const chess = new Chess();
  const positions: MovePosition[] = [{ fen: chess.fen(), lastMove: null }];

  try {
    for (const move of moves) {
      const played = move.san
        ? chess.move(move.san)
        : move.from && move.to
          ? chess.move({ from: move.from as Square, to: move.to as Square, promotion: "q" })
          : null;
      if (!played) throw new Error("Un coup ne contient pas de notation exploitable.");
      positions.push({
        fen: chess.fen(),
        lastMove: { from: played.from, to: played.to },
      });
    }
    return { positions, error: null };
  } catch (error) {
    return {
      positions: [] as MovePosition[],
      error: error instanceof Error ? error.message : "Historique invalide.",
    };
  }
}
