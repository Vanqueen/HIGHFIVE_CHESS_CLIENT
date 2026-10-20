import { useMemo } from 'react';
import type { Square } from 'chess.js';

const PIECE_UNICODE: Record<string, string> = {
  wK: '\u2654', wQ: '\u2655', wR: '\u2656', wB: '\u2657', wN: '\u2658', wP: '\u2659',
  bK: '\u265A', bQ: '\u265B', bR: '\u265C', bB: '\u265D', bN: '\u265E', bP: '\u265F',
};

type ChessBoardProps = {
  fen: string;
  selectedSquare: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  onSquareClick: (square: Square) => void;
  flipped?: boolean;
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function fenToBoard(fen: string): Record<string, string> {
  const board: Record<string, string> = {};
  const rows = fen.split(' ')[0].split('/');
  for (let r = 0; r < 8; r++) {
    let fileIdx = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        fileIdx += parseInt(ch);
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const piece = color + ch.toUpperCase();
        const sq = FILES[fileIdx] + RANKS[r];
        board[sq] = piece;
        fileIdx++;
      }
    }
  }
  return board;
}

export default function ChessBoard({
  fen,
  selectedSquare,
  legalTargets,
  lastMove,
  onSquareClick,
  flipped = false,
}: ChessBoardProps) {
  const board = useMemo(() => fenToBoard(fen), [fen]);
  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;

  return (
    <div className="vc-chessboard inline-block">
      <div className="flex">
        <div className="vc-chessboard__ranks flex flex-col justify-around pr-1">
          {ranks.map((r) => (
            <div key={r} className="vc-chessboard__coordinate h-[12.5%] flex items-center text-xs text-slate-500 font-medium">
              {r}
            </div>
          ))}
        </div>
        <div className="vc-chessboard__squares grid grid-cols-8 rounded-lg overflow-hidden shadow-2xl ring-1 ring-slate-300/20">
          {ranks.map((rank) =>
            files.map((file) => {
              const sq = (file + rank) as Square;
              const isLight = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0;
              const piece = board[sq];
              const isSelected = selectedSquare === sq;
              const isTarget = legalTargets.includes(sq);
              const isLastMove =
                lastMove && (lastMove.from === sq || lastMove.to === sq);

              return (
                <div
                  key={sq}
                  onClick={() => onSquareClick(sq)}
                  className={`vc-chessboard__square ${isLight ? 'is-light' : 'is-dark'} relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center cursor-pointer transition-colors
                    ${isSelected ? 'is-selected ring-2 ring-inset ring-blue-500' : ''}
                    ${isLastMove && !isSelected ? 'is-last-move bg-yellow-300/40' : ''}`}
                >
                  {piece && (
                    <span
                      className={`text-3xl sm:text-4xl md:text-5xl select-none leading-none ${
                        piece[0] === 'w' ? 'text-white' : 'text-slate-900'
                      }`}
                      style={{ textShadow: piece[0] === 'w' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}
                    >
                      {PIECE_UNICODE[piece]}
                    </span>
                  )}
                  {isTarget && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {piece ? (
                        <div className="vc-chessboard__capture w-full h-full border-4 border-blue-500/60 rounded-full" />
                      ) : (
                        <div className="vc-chessboard__target w-3 h-3 sm:w-4 sm:h-4 bg-blue-500/60 rounded-full" />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="vc-chessboard__files flex pl-6">
        {files.map((f) => (
          <div key={f} className="vc-chessboard__coordinate w-12 sm:w-14 md:w-16 text-center text-xs text-slate-500 font-medium pt-1">
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}
