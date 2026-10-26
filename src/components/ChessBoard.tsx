import { useMemo, type ReactNode } from 'react';
import type { Square } from 'chess.js';
import { useChessAppearance } from '../context/ChessAppearanceContext';
import type { BoardTheme, PieceStyle } from '../chess/chessAppearance';
import { KANEO_PIECES } from '../assets/pieces/kaneo';

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
  /** Overrides the user's saved preference — for decorative/preview boards only. */
  boardTheme?: BoardTheme;
  /** Overrides the user's saved preference — for decorative/preview boards only. */
  pieceStyle?: PieceStyle;
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_NAMES: Record<string, string> = {
  K: 'roi',
  Q: 'dame',
  R: 'tour',
  B: 'fou',
  N: 'cavalier',
  P: 'pion',
};

function SculptedPiece({ kind, color }: { kind: string; color: 'white' | 'black' }) {
  const pieceShapes: Record<string, ReactNode> = {
    K: (
      <>
        <path d="M47 9h6v8h8v6h-8v7h-6v-7h-8v-6h8z" />
        <path d="M36 38c0-6 6-10 14-10s14 4 14 10l9 8-6 9H35l-6-9z" />
        <path d="M40 55h20l5 8-7 5 4 19H38l4-19-7-5z" />
        <path d="M31 85h38l8 7-2 5H25l-2-5z" />
      </>
    ),
    Q: (
      <>
        <circle cx="30" cy="21" r="5" />
        <circle cx="50" cy="14" r="5" />
        <circle cx="70" cy="21" r="5" />
        <path d="m30 25 7 13h26l7-13-4 21H34z" />
        <path d="M38 48h24l5 8-7 6 4 24H36l4-24-7-6z" />
        <path d="M30 85h40l7 7-2 5H25l-2-5z" />
      </>
    ),
    R: (
      <>
        <path d="M31 17h9v9h7v-9h7v9h7v-9h8v19H31z" />
        <path d="M35 39h30l-4 11-5 7H44l-5-7z" />
        <path d="M43 57h14l3 8-5 6 4 16H41l4-16-5-6z" />
        <path d="M31 85h38l8 7-2 5H25l-2-5z" />
      </>
    ),
    B: (
      <>
        <circle cx="50" cy="19" r="8" />
        <path d="M50 28c-8 2-14 7-14 14l5 10h18l5-10c0-7-6-12-14-14z" />
        <path d="m40 49 20 0 5 9-7 6 4 22H38l4-22-7-6z" />
        <path d="M31 85h38l8 7-2 5H25l-2-5z" />
        <path d="m54 33-8 16" className="vc-chess-piece__cut" />
      </>
    ),
    N: (
      <>
        <path d="M32 84c3-12 3-23-2-34 8 1 14 6 17 13 4-12 1-22-6-32 18 3 30 16 29 32l-2 21z" />
        <path d="M37 54c8-3 17-2 25 2" className="vc-chess-piece__cut" />
        <circle cx="53" cy="39" r="2.5" className="vc-chess-piece__eye" />
        <path d="M31 84h39l7 8-2 5H25l-2-5z" />
      </>
    ),
    P: (
      <>
        <circle cx="50" cy="25" r="10" />
        <path d="M43 36h14l3 11 8 10-7 8 4 20H35l4-20-7-8 8-10z" />
        <path d="M31 83h38l8 9-2 5H25l-2-5z" />
      </>
    ),
  };

  return (
    <svg
      className={`vc-chess-piece vc-chess-piece--${color}`}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${PIECE_NAMES[kind] ?? 'pièce'} ${color === 'white' ? 'blanc' : 'noir'}`}
    >
      {pieceShapes[kind] ?? pieceShapes.P}
    </svg>
  );
}

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
  boardTheme: boardThemeOverride,
  pieceStyle: pieceStyleOverride,
}: ChessBoardProps) {
  const appearance = useChessAppearance();
  const boardTheme = boardThemeOverride ?? appearance.boardTheme;
  const pieceStyle = pieceStyleOverride ?? appearance.pieceStyle;
  const board = useMemo(() => fenToBoard(fen), [fen]);
  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;

  return (
    <div className="vc-chessboard inline-block" data-board-theme={boardTheme}>
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
                    pieceStyle === 'realistic' ? (
                      <span
                        className="vc-chess-piece-image"
                        role="img"
                        aria-label={`${PIECE_NAMES[piece[1]] ?? 'pièce'} ${piece[0] === 'w' ? 'blanche' : 'noire'}`}
                        dangerouslySetInnerHTML={{ __html: KANEO_PIECES[piece] }}
                      />
                    ) : pieceStyle === 'sculpted' ? (
                      <SculptedPiece kind={piece[1]} color={piece[0] === 'w' ? 'white' : 'black'} />
                    ) : (
                      <span
                        className={`vc-chess-piece-glyph select-none leading-none ${
                          piece[0] === 'w' ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {PIECE_UNICODE[piece]}
                      </span>
                    ))}
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
