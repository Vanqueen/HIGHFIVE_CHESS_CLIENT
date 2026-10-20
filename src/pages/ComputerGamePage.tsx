import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import {
  ArrowLeft,
  Bot,
  Clock3,
  LoaderCircle,
  Play,
  RotateCcw,
  Trophy,
  UserRound,
} from "lucide-react";
import ChessBoard from "../components/ChessBoard";
import { chooseComputerMove } from "../chess/computerPlayer";

type Difficulty = "easy" | "medium" | "hard";
type PlayerColor = "WHITE" | "BLACK";
type ComputerGamePageProps = { onExit?: () => void };

function difficultyLabel(difficulty: Difficulty) {
  return ({ easy: "Facile", medium: "Intermédiaire", hard: "Difficile" })[difficulty];
}

function gameResult(chess: Chess, playerColor: PlayerColor) {
  if (chess.isCheckmate()) {
    return chess.turn() === (playerColor === "WHITE" ? "w" : "b")
      ? "Échec et mat. L’ordinateur gagne."
      : "Échec et mat. Vous gagnez !";
  }
  if (chess.isStalemate()) return "Pat : la partie est nulle.";
  if (chess.isThreefoldRepetition()) return "Nulle par répétition.";
  if (chess.isInsufficientMaterial()) return "Nulle : matériel insuffisant.";
  if (chess.isDraw()) return "Partie nulle.";
  return null;
}

export default function ComputerGamePage({ onExit }: ComputerGamePageProps) {
  const [fen, setFen] = useState(() => new Chess().fen());
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [playerColor, setPlayerColor] = useState<PlayerColor>("WHITE");
  const [initialTimeSeconds, setInitialTimeSeconds] = useState(300);
  const [started, setStarted] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [moves, setMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState({ WHITE: 300, BLACK: 300 });
  const aiTimerRef = useRef<number | null>(null);
  const chess = useMemo(() => new Chess(fen), [fen]);
  const aiColor = playerColor === "WHITE" ? "b" : "w";
  const activeColor = chess.turn() === "w" ? "WHITE" : "BLACK";

  const commitMove = (move: ReturnType<Chess["move"]>) => {
    setMoves((current) => [...current, move.san]);
    setLastMove({ from: move.from, to: move.to });
    const nextFen = chess.fen();
    setFen(nextFen);
    setSelectedSquare(null);
    setLegalTargets([]);
    const endResult = gameResult(chess, playerColor);
    if (endResult) setResult(endResult);
    setThinking(
      !endResult &&
      (chess.turn() === "w" ? "WHITE" : "BLACK") !== playerColor,
    );
  };

  useEffect(() => {
    if (!started || result || activeColor !== (aiColor === "w" ? "WHITE" : "BLACK")) return;
    aiTimerRef.current = window.setTimeout(() => {
      const current = new Chess(fen);
      const move = chooseComputerMove(fen, difficulty);
      if (!move) {
        setResult(gameResult(current, playerColor) ?? "Aucun coup légal : partie terminée.");
        setThinking(false);
        return;
      }
      const played = current.move(move);
      setFen(current.fen());
      setMoves((currentMoves) => [...currentMoves, played.san]);
      setLastMove({ from: played.from, to: played.to });
      setResult(gameResult(current, playerColor));
      setSelectedSquare(null);
      setLegalTargets([]);
      setThinking(false);
    }, 250);
    return () => {
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    };
  }, [activeColor, aiColor, difficulty, fen, playerColor, result, started]);

  useEffect(() => {
    if (!started || result || initialTimeSeconds === 0) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, secondsLeft[activeColor] - 1);
      setSecondsLeft((current) => {
        return { ...current, [activeColor]: remaining };
      });
      if (remaining === 0) {
        setResult(activeColor === playerColor
          ? "Temps écoulé. L’ordinateur gagne."
          : "Temps écoulé. Vous gagnez !");
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [activeColor, initialTimeSeconds, playerColor, result, secondsLeft, started]);

  const handleSquareClick = (square: Square) => {
    if (!started || thinking || result || activeColor !== playerColor) return;
    if (!selectedSquare) {
      const piece = chess.get(square);
      if (!piece || piece.color !== (playerColor === "WHITE" ? "w" : "b")) return;
      setSelectedSquare(square);
      setLegalTargets(chess.moves({ square, verbose: true }).map((move) => move.to));
      return;
    }

    if (!legalTargets.includes(square)) {
      const piece = chess.get(square);
      if (piece && piece.color === (playerColor === "WHITE" ? "w" : "b")) {
        setSelectedSquare(square);
        setLegalTargets(chess.moves({ square, verbose: true }).map((move) => move.to));
      } else {
        setSelectedSquare(null);
        setLegalTargets([]);
      }
      return;
    }

    const move = chess.move({ from: selectedSquare, to: square, promotion: "q" });
    commitMove(move);
  };

  const startGame = () => {
    const nextChess = new Chess();
    setFen(nextChess.fen());
    setMoves([]);
    setLastMove(null);
    setResult(null);
    setSelectedSquare(null);
    setLegalTargets([]);
    setSecondsLeft({ WHITE: initialTimeSeconds, BLACK: initialTimeSeconds });
    setThinking(playerColor === "BLACK");
    setStarted(true);
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  if (!started) {
    return (
      <main className="player-dashboard vc-play-page">
        <section className="welcome-line">
          <div>
            <p className="eyebrow">PARTIE LOCALE</p>
            <h1>Jouer contre l’ordinateur</h1>
            <p className="welcome-line__text">Choisissez votre couleur, la cadence et le niveau avant de commencer.</p>
          </div>
          {onExit && (
            <button type="button" onClick={onExit} className="vc-game-back">
              <ArrowLeft size={16} /> Retour au jeu
            </button>
          )}
        </section>
        <section className="mx-auto grid w-full max-w-2xl gap-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            Votre couleur
            <select
              value={playerColor}
              onChange={(event) => setPlayerColor(event.target.value as PlayerColor)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
            >
              <option value="WHITE">Blancs — jouer en premier</option>
              <option value="BLACK">Noirs — laisser l’ordinateur commencer</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Niveau de l’ordinateur
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
            >
              <option value="easy">Facile</option>
              <option value="medium">Intermédiaire</option>
              <option value="hard">Difficile</option>
            </select>
          </label>
          <label className="text-sm text-slate-300 sm:col-span-2">
            Cadence
            <select
              value={initialTimeSeconds}
              onChange={(event) => setInitialTimeSeconds(Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
            >
              <option value={0}>Sans limite</option>
              <option value={60}>1 minute</option>
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={900}>15 minutes</option>
            </select>
          </label>
          <button
            type="button"
            onClick={startGame}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-200 sm:col-span-2"
          >
            <Play size={17} fill="currentColor" /> Commencer la partie
          </button>
        </section>
      </main>
    );
  }

  return (
    <section className="vc-game-screen">
      <header className="vc-game-heading">
        <div className="vc-game-heading__title">
          <Bot size={23} aria-hidden="true" />
          <div>
            <h1>Partie contre l’ordinateur</h1>
            <p>{difficultyLabel(difficulty)} · {initialTimeSeconds === 0 ? "Sans limite" : `${Math.floor(initialTimeSeconds / 60)} min`}</p>
          </div>
        </div>
        <button type="button" onClick={startGame} className="vc-game-back">
          <RotateCcw size={16} /> Nouvelle partie
        </button>
      </header>

      {result && <p className="vc-game-alert is-notice" role="status"><Trophy size={17} /> {result}</p>}

      <div className="vc-game-layout">
        <section className="vc-game-board-panel" aria-label="Échiquier">
          <div className={`vc-game-player${activeColor !== playerColor ? " is-active" : ""}`}>
            <span className="vc-game-avatar"><Bot size={22} /></span>
            <span className="vc-game-player__identity">
              <strong>Ordinateur</strong>
              <small><i /> {difficultyLabel(difficulty)} · {playerColor === "WHITE" ? "Noirs" : "Blancs"}</small>
            </span>
            <span className="vc-game-clock"><Clock3 size={19} /><strong>{initialTimeSeconds === 0 ? "∞" : formatTime(secondsLeft[playerColor === "WHITE" ? "BLACK" : "WHITE"])}</strong></span>
          </div>
          <div className="vc-game-board-frame">
            <ChessBoard
              fen={fen}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              lastMove={lastMove}
              onSquareClick={handleSquareClick}
              flipped={playerColor === "BLACK"}
            />
          </div>
          <div className={`vc-game-player vc-game-player--self${activeColor === playerColor ? " is-active" : ""}`}>
            <span className="vc-game-avatar vc-game-avatar--self"><UserRound size={21} /></span>
            <span className="vc-game-player__identity">
              <strong>Vous</strong>
              <small><i /> {playerColor === "WHITE" ? "Blancs" : "Noirs"}</small>
            </span>
            <span className="vc-game-clock"><Clock3 size={19} /><strong>{initialTimeSeconds === 0 ? "∞" : formatTime(secondsLeft[playerColor])}</strong></span>
          </div>
          {thinking && <p className="vc-game-status"><LoaderCircle size={15} className="animate-spin" /> L’ordinateur réfléchit…</p>}
        </section>

        <aside className="vc-game-sidepanel">
          <nav className="vc-game-tabs" aria-label="Historique de la partie">
            <span className="is-active">Coups joués ({moves.length})</span>
          </nav>
          <div className="vc-game-panel-content">
            {moves.length === 0 ? (
              <p className="vc-game-empty">La partie commence. À vous de jouer !</p>
            ) : (
              <div className="vc-game-move-list">
                {Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => (
                  <div className="vc-game-move-row" key={index}>
                    <span>{index + 1}.</span>
                    <strong>{moves[index * 2] ?? "—"}</strong>
                    <strong>{moves[index * 2 + 1] ?? "—"}</strong>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={onExit}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft size={15} /> Quitter la partie
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
