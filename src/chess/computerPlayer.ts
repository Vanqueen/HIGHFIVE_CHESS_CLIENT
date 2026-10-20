import { Chess } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 900,
  k: 20_000,
};

function evaluatePosition(chess: Chess, perspective: "w" | "b") {
  if (chess.isCheckmate()) {
    return chess.turn() === perspective ? -100_000 : 100_000;
  }
  if (chess.isDraw()) return 0;

  let score = 0;
  const board = chess.board();
  for (let rank = 0; rank < board.length; rank++) {
    for (let file = 0; file < board[rank].length; file++) {
      const piece = board[rank][file];
      if (!piece) continue;
      const sign = piece.color === perspective ? 1 : -1;
      const centerDistance =
        Math.abs(3.5 - file) + Math.abs(3.5 - rank);
      const centerBonus = piece.type === "p" || piece.type === "n" || piece.type === "b"
        ? Math.round((7 - centerDistance) * 3)
        : 0;
      score += sign * (PIECE_VALUES[piece.type] + centerBonus);
    }
  }

  return score;
}

function orderedMoves(chess: Chess) {
  return chess.moves({ verbose: true }).sort((first, second) => {
    const firstValue = (first.captured ? PIECE_VALUES[first.captured] : 0) +
      (first.promotion ? PIECE_VALUES[first.promotion] : 0);
    const secondValue = (second.captured ? PIECE_VALUES[second.captured] : 0) +
      (second.promotion ? PIECE_VALUES[second.promotion] : 0);
    return secondValue - firstValue;
  });
}

function search(
  chess: Chess,
  depth: number,
  perspective: "w" | "b",
  alpha: number,
  beta: number,
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess, perspective);
  }

  const maximizing = chess.turn() === perspective;
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  for (const move of orderedMoves(chess)) {
    chess.move(move);
    const score = search(chess, depth - 1, perspective, alpha, beta);
    chess.undo();

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export function chooseComputerMove(
  fen: string,
  difficulty: "easy" | "medium" | "hard",
) {
  const chess = new Chess(fen);
  const moves = orderedMoves(chess);
  if (moves.length === 0) return null;
  const depth = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  const perspective = chess.turn();
  let bestScore = Number.NEGATIVE_INFINITY;
  const bestMoves: typeof moves = [];

  for (const move of moves) {
    chess.move(move);
    const score = search(chess, depth - 1, perspective, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    chess.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMoves.length = 0;
      bestMoves.push(move);
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null;
}
