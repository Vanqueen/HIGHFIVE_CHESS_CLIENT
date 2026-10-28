import { ChessKnight } from 'lucide-react';
import './ChessLoadingScreen.css';

type ChessLoadingScreenProps = {
  message?: string;
};

export default function ChessLoadingScreen({ message = 'Préparation de votre espace de jeu…' }: ChessLoadingScreenProps) {
  return (
    <main className="chess-loading" role="status" aria-live="polite">
      <div className="chess-loading__card">
        <div className="chess-loading__board" aria-hidden="true">
          {Array.from({ length: 64 }, (_, index) => (
            <span
              key={index}
              className={`chess-loading__square${(Math.floor(index / 8) + index % 8) % 2 ? ' is-dark' : ''}${index === 27 || index === 36 ? ' is-active' : ''}`}
            />
          ))}
          <span className="chess-loading__knight"><ChessKnight size={40} strokeWidth={1.8} /></span>
        </div>
        <div className="chess-loading__brand">CHESS<span>ARENA</span></div>
        <p className="chess-loading__message">{message}</p>
        <span className="chess-loading__progress" aria-hidden="true"><i /></span>
      </div>
    </main>
  );
}
