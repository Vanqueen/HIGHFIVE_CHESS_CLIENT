import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Gamepad2,
  Medal,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Chess } from "chess.js";
import axiosInstance from "../axios";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "../context/NavigationContext";
import ChessBoard from "../components/ChessBoard";

type HomeGame = {
  id: number;
  status: string;
};

type HomeTournament = {
  id: number;
  name: string;
  format: "SWISS" | "ROUND_ROBIN";
  status: string;
  startsAt: string;
  maxParticipants: number;
};

type HomeRatings = {
  overallRating: number;
  modes: Array<{ category: "BLITZ" | "RAPID" | "CLASSICAL"; rating: number }>;
};

type HomePageProps = {
  onStartGame: (initialTimeSeconds: number, incrementSeconds: number) => void;
};

type GameFormat = "classic" | "rapid" | "blitz" | "custom";

const GAME_FORMATS: Array<{ id: GameFormat; label: string; description: string }> = [
  { id: "classic", label: "Classique", description: "Prends le temps de réfléchir. Idéal pour progresser." },
  { id: "rapid", label: "Rapide", description: "Une partie dynamique, sans se presser." },
  { id: "blitz", label: "Blitz", description: "Des décisions rapides et des parties intenses." },
  { id: "custom", label: "Personnalisé", description: "Choisis la cadence qui te convient." },
];

const TIME_CONTROLS = [
  { label: "3 + 0", detail: "3 min", seconds: 180, increment: 0 },
  { label: "5 + 0", detail: "5 min", seconds: 300, increment: 0 },
  { label: "10 + 0", detail: "10 min", seconds: 600, increment: 0 },
  { label: "15 + 10", detail: "15 min", seconds: 900, increment: 10 },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Impossible de charger vos données.";
}

export default function HomePage({ onStartGame }: HomePageProps) {
  const { profile, accessToken } = useAuth();
  const { setTab } = useNavigation();
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [upcomingTournaments, setUpcomingTournaments] = useState<HomeTournament[]>([]);
  const [ratings, setRatings] = useState<HomeRatings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameFormat, setGameFormat] = useState<GameFormat>("classic");
  const [selectedControl, setSelectedControl] = useState("10 + 0");
  const [customIncrement, setCustomIncrement] = useState(0);
  const chessPreview = new Chess();

  useEffect(() => {
    if (!profile?.id || !accessToken) return;
    let cancelled = false;
    void Promise.allSettled([
      axiosInstance.get<HomeGame[]>("/games/me"),
      axiosInstance.get<HomeTournament[]>("/tournaments"),
      axiosInstance.get<HomeRatings>("/users/me/ratings"),
    ]).then(([gamesResult, tournamentsResult, ratingsResult]) => {
      if (cancelled) return;
      const errors: string[] = [];
      if (gamesResult.status === "fulfilled") {
        setHasActiveGame(gamesResult.value.data.some(
          (game) => game.status === "WAITING" || game.status === "IN_PROGRESS",
        ));
      } else {
        errors.push(getErrorMessage(gamesResult.reason));
      }
      if (tournamentsResult.status === "fulfilled") {
        setUpcomingTournaments(tournamentsResult.value.data
          .filter((tournament) =>
            (tournament.status === "DRAFT" || tournament.status === "REGISTRATION_OPEN") &&
            Date.parse(tournament.startsAt) >= Date.now(),
          )
          .sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt))
          .slice(0, 3));
      } else {
        errors.push(getErrorMessage(tournamentsResult.reason));
      }
      if (ratingsResult.status === "fulfilled") {
        setRatings(ratingsResult.value.data);
      } else {
        errors.push(getErrorMessage(ratingsResult.reason));
      }
      setError(errors.join(" "));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, profile?.id]);

  if (!profile?.id) {
    const visibleControls = TIME_CONTROLS;
    const selected = visibleControls.find((control) => control.label === selectedControl)
      ?? visibleControls[2];
    const formatDescription = gameFormat === "custom"
      ? "Ajuste l’incrément de temps selon tes préférences."
      : GAME_FORMATS.find((format) => format.id === gameFormat)?.description;

    return (
      <div className="vc-guest-home">
        <section className="vc-guest-welcome">
          <div>
            <p className="vc-guest-eyebrow">CHESSARENA · JEU LIBRE</p>
            <h1>Prêt à jouer ?</h1>
            <p>Choisis un mode et trouve un adversaire en quelques secondes.<br />Que tu sois débutant ou confirmé, chaque partie compte !</p>
          </div>
          <div className="vc-guest-welcome__piece" aria-hidden="true">♟</div>
        </section>

        <div className="vc-guest-main-grid">
          <div className="vc-guest-game-column">
            <section className="vc-guest-config" aria-label="Configurer une partie">
              <div className="vc-guest-format-tabs" role="tablist" aria-label="Mode de jeu">
                {GAME_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    role="tab"
                    aria-selected={gameFormat === format.id}
                    className={gameFormat === format.id ? "is-active" : ""}
                    onClick={() => {
                      setGameFormat(format.id);
                      const defaultControl = {
                        classic: "10 + 0",
                        rapid: "5 + 0",
                        blitz: "3 + 0",
                        custom: selectedControl,
                      }[format.id];
                      setSelectedControl(defaultControl);
                      const defaultPreset = TIME_CONTROLS.find((control) => control.label === defaultControl);
                      if (defaultPreset) setCustomIncrement(defaultPreset.increment);
                    }}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
              <h2>Partie {GAME_FORMATS.find((format) => format.id === gameFormat)?.label}</h2>
              <p className="vc-guest-config__description">{formatDescription}</p>
              <div className="vc-guest-time-options" role="group" aria-label="Cadence de la partie">
                {visibleControls.map((control) => (
                  <button
                    key={control.label}
                    type="button"
                    aria-pressed={selected?.label === control.label}
                    className={selected?.label === control.label ? "is-selected" : ""}
                    onClick={() => {
                      setSelectedControl(control.label);
                      setCustomIncrement(control.increment);
                    }}
                  >
                    <strong>{control.label}</strong>
                    <small>{control.detail}</small>
                    {selected?.label === control.label && <Check size={14} aria-hidden="true" />}
                  </button>
                ))}
              </div>
              {gameFormat === "custom" && (
                <label className="vc-guest-increment">
                  Incrément par coup
                  <select
                    value={customIncrement}
                    onChange={(event) => setCustomIncrement(Number(event.target.value))}
                  >
                    <option value={0}>0 seconde</option>
                    <option value={2}>2 secondes</option>
                    <option value={5}>5 secondes</option>
                    <option value={10}>10 secondes</option>
                  </select>
                </label>
              )}
              <button
                type="button"
                className="vc-guest-start"
                onClick={() => onStartGame(selected?.seconds ?? 600, gameFormat === "custom" ? customIncrement : selected?.increment ?? 0)}
              >
                <Gamepad2 size={17} /> Jouer maintenant
              </button>
            </section>

            <button
              type="button"
              className="vc-guest-friend"
              onClick={() => setTab("play")}
            >
              <span className="vc-guest-friend__icon"><Users size={21} /></span>
              <span><strong>Jouer avec un ami</strong><small>Partage un lien et défie un proche</small></span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

          <aside className="vc-guest-board-card">
            <div className="vc-guest-preview-board" aria-hidden="true">
              <ChessBoard
                fen={chessPreview.fen()}
                selectedSquare={null}
                legalTargets={[]}
                lastMove={null}
                onSquareClick={() => {}}
              />
            </div>
            <p>Un échiquier, mille possibilités.</p>
            <span aria-hidden="true" />
          </aside>
        </div>
      </div>
    );
  }

  const actions = [
    {
      title: "Défier un joueur",
      description: "Lancez un défi ou invitez un ami par lien.",
      icon: <Swords aria-hidden="true" />,
      className: "is-green",
      tab: "play" as const,
    },
    {
      title: "Jouer contre l’ordinateur",
      description: "Entraînez-vous à votre rythme, sans adversaire.",
      icon: <Bot aria-hidden="true" />,
      className: "is-violet",
      tab: "computer" as const,
    },
    {
      title: "Mes parties",
      description: "Retrouvez vos parties et vos résultats.",
      icon: <Gamepad2 aria-hidden="true" />,
      className: "is-blue",
      tab: "games" as const,
    },
    {
      title: "Tournois",
      description: "Découvrez les compétitions disponibles.",
      icon: <Trophy aria-hidden="true" />,
      className: "is-gold",
      tab: "tournaments" as const,
    },
    {
      title: "Communauté",
      description: "Retrouvez les joueurs et vos amis.",
      icon: <Users aria-hidden="true" />,
      className: "is-violet",
      tab: "friends" as const,
    },
  ];

  return (
    <div className="vc-home-modern">
      <section className="vc-home-hero">
        <div className="vc-home-hero__copy">
          <span className="vc-home-eyebrow">BIENVENUE SUR</span>
          <h1>CHESSARENA</h1>
          <p className="vc-home-hero__motto">Jouez <i /> Progressez <i /> Partagez</p>
          <p>
            Bonjour{profile?.username ? ` ${profile.username}` : ""} ! Que vous soyez
            débutant ou joueur confirmé, trouvez votre prochaine partie.
          </p>
          <div className="vc-home-hero__actions">
            <button type="button" className="vc-home-primary" onClick={() => setTab("play")}>
              <Gamepad2 size={18} />
              {hasActiveGame ? "Reprendre ma partie" : "Jouer maintenant"}
            </button>
            <button type="button" className="vc-home-secondary" onClick={() => setTab("learn")}>
              Que vous soyez débutant ou joueur confirmé
            </button>
            <button
              type="button"
              className="vc-home-secondary vc-home-computer"
              onClick={() => setTab("computer")}
            >
              <Bot size={17} aria-hidden="true" />
              Jouer contre l’ordinateur
            </button>
          </div>
        </div>
        <div className="vc-home-hero__board" aria-hidden="true">
          <div className="vc-home-board">
            <span className="vc-home-board__piece">♞</span>
            <span className="vc-home-board__piece vc-home-board__piece--light">♙</span>
          </div>
          <span className="vc-home-hero__note">Un coup<br />à la fois...</span>
        </div>
      </section>

      {error && (
        <p className="vc-home-error" role="status">
          Certaines informations n’ont pas pu être chargées. {error}
        </p>
      )}

      <section className="vc-home-modes">
        <div className="vc-home-section-heading">
          <div>
            <h2>Modes de jeu</h2>
          </div>
          <button type="button" className="vc-home-text-link" onClick={() => setTab("play")}>
            Voir tout <ArrowRight size={15} />
          </button>
        </div>
        <div className="vc-home-mode-grid">
          {[
            { title: "Rapide", detail: "Parties de 10 min ou moins", rating: ratings?.modes.find((mode) => mode.category === "RAPID")?.rating ?? 1500, icon: <Zap />, theme: "is-green", action: () => onStartGame(600, 0) },
            { title: "Classique", detail: "Plus de temps, plus de stratégie", rating: ratings?.modes.find((mode) => mode.category === "CLASSICAL")?.rating ?? 1500, icon: <Clock3 />, theme: "is-blue", action: () => onStartGame(900, 10) },
            { title: "Blitz", detail: "Parties intenses et rapides", rating: ratings?.modes.find((mode) => mode.category === "BLITZ")?.rating ?? 1500, icon: <Medal />, theme: "is-violet", action: () => onStartGame(180, 0) },
            { title: "Tournois", detail: "Affrontez la communauté", rating: undefined, icon: <Users />, theme: "is-orange", action: () => setTab("tournaments") },
          ].map((mode) => (
            <article className={`vc-home-mode-card ${mode.theme}`} key={mode.title}>
              <span className="vc-home-mode-card__icon">{mode.icon}</span>
              <strong>{mode.title}</strong>
              <small>{mode.detail}</small>
              {mode.rating !== undefined && (
                <span className="vc-home-mode-card__rating">{mode.rating} <small>Elo</small></span>
              )}
              <button type="button" onClick={mode.action}>
                {mode.title === "Tournois" ? "Voir" : "Jouer"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="vc-home-tournaments">
        <div className="vc-home-section-heading">
          <h2>Prochains tournois</h2>
          <button type="button" className="vc-home-text-link" onClick={() => setTab("tournaments")}>
            Voir tout <ArrowRight size={15} />
          </button>
        </div>
        {upcomingTournaments.length > 0 ? (
          <div className="vc-home-tournament-grid">
            {upcomingTournaments.map((tournament, index) => (
              <article className={`vc-home-tournament-card tone-${index + 1}`} key={tournament.id}>
                <span className="vc-home-tournament-card__icon">
                  {index === 0 ? <Trophy /> : index === 1 ? <Medal /> : <CalendarDays />}
                </span>
                <div>
                  <strong>{tournament.name}</strong>
                  <small>
                    {tournament.format === "SWISS" ? "Système suisse" : "Toutes rondes"}
                    {" · "}
                    {new Date(tournament.startsAt).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </small>
                </div>
                <button type="button" onClick={() => setTab("tournaments")}>Voir</button>
              </article>
            ))}
          </div>
        ) : (
          <div className="vc-home-tournaments-empty">
            <CalendarDays size={19} />
            <span>{loading ? "Chargement des prochains tournois…" : "Aucun tournoi à venir pour le moment."}</span>
          </div>
        )}
      </section>

      <section className="vc-home-discover">
        <div className="vc-home-section-heading">
          <div>
            <span className="vc-home-eyebrow"><BookOpen size={13} /> VOTRE CLUB</span>
            <h2>Explorez ChessArena</h2>
          </div>
        </div>
        <div className="vc-home-action-grid">
          {actions.map((action) => (
            <button
              type="button"
              key={action.title}
              className={`vc-home-action ${action.className}`}
              onClick={() => setTab(action.tab)}
            >
              <span className="vc-home-action__icon">{action.icon}</span>
              <span className="vc-home-action__copy">
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>
              <ArrowRight className="vc-home-action__arrow" size={17} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="vc-home-learn" onClick={() => setTab("play")}>
        <span className="vc-home-learn__icon"><Swords size={21} /></span>
        <span>
          <strong>Prêt pour un nouveau défi ?</strong>
          <small>Choisissez votre cadence et invitez quelqu’un en quelques secondes.</small>
        </span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
