import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  BookOpen,
  CalendarDays,
  Check,
  Gamepad2,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { Chess } from "chess.js";
import axiosInstance from "../axios";
import { useAuth } from "../context/AuthContext";
import { useChessAppearance } from "../context/ChessAppearanceContext";
import { useNavigation } from "../context/NavigationContext";
import ChessBoard from "../components/ChessBoard";
import BoardThemeOptions from "../components/BoardThemeOptions";

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

type SecondaryAction = {
  label: string;
  detail: string;
  icon: ReactNode;
  onClick: () => void;
};

type GameLaunchPanelProps = {
  heading: ReactNode;
  meta?: string;
  subheading: string;
  primaryLabel: string;
  showPicker: boolean;
  showBoardThemes?: boolean;
  onStart: (seconds: number, increment: number) => void;
  secondaryActions: SecondaryAction[];
};

function GameLaunchPanel({
  heading,
  meta,
  subheading,
  primaryLabel,
  showPicker,
  showBoardThemes = false,
  onStart,
  secondaryActions,
}: GameLaunchPanelProps) {
  const [gameFormat, setGameFormat] = useState<GameFormat>("classic");
  const [selectedControl, setSelectedControl] = useState("10 + 0");
  const [customIncrement, setCustomIncrement] = useState(0);
  const selected = TIME_CONTROLS.find((control) => control.label === selectedControl)
    ?? TIME_CONTROLS[2];
  const formatDescription = gameFormat === "custom"
    ? "Ajuste l’incrément de temps selon tes préférences."
    : GAME_FORMATS.find((format) => format.id === gameFormat)?.description;

  return (
    <aside className="vc-home-launch__panel">
      <div className="vc-home-launch__intro">
        <h1>{heading}</h1>
        {meta && <p className="vc-home-launch__meta">{meta}</p>}
        <p>{subheading}</p>
      </div>

      {showBoardThemes && (
        <section className="vc-home-theme-picker" aria-label="Choix du thème de l’échiquier">
          <h2>Choisis ton plateau</h2>
          <p>Sélectionne les couleurs qui te plaisent.</p>
          <BoardThemeOptions />
        </section>
      )}

      {showPicker && (
        <>
          <div className="vc-home-launch__tabs" role="tablist" aria-label="Mode de jeu">
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
          <p className="vc-home-launch__format-description">{formatDescription}</p>
          <div className="vc-home-launch__times" role="group" aria-label="Cadence de la partie">
            {TIME_CONTROLS.map((control) => (
              <button
                key={control.label}
                type="button"
                aria-pressed={selected.label === control.label}
                className={selected.label === control.label ? "is-selected" : ""}
                onClick={() => {
                  setSelectedControl(control.label);
                  setCustomIncrement(control.increment);
                }}
              >
                <strong>{control.label}</strong>
                <small>{control.detail}</small>
                {selected.label === control.label && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
          </div>
          {gameFormat === "custom" && (
            <label className="vc-home-launch__increment">
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
        </>
      )}

      <button
        type="button"
        className="vc-home-launch__start"
        onClick={() => onStart(selected.seconds, gameFormat === "custom" ? customIncrement : selected.increment)}
      >
        <Gamepad2 size={18} /> {primaryLabel}
      </button>

      <div className="vc-home-launch__secondary">
        {secondaryActions.map((action) => (
          <button key={action.label} type="button" onClick={action.onClick}>
            <span className="vc-home-launch__secondary-icon">{action.icon}</span>
            <span className="vc-home-launch__secondary-copy">
              <strong>{action.label}</strong>
              <small>{action.detail}</small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default function HomePage({ onStartGame }: HomePageProps) {
  const { profile, accessToken } = useAuth();
  const { boardTheme } = useChessAppearance();
  const { setTab } = useNavigation();
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [upcomingTournaments, setUpcomingTournaments] = useState<HomeTournament[]>([]);
  const [ratings, setRatings] = useState<HomeRatings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const startingPosition = new Chess();

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

  const board = (
    <div className="vc-home-launch__board" aria-hidden="true">
      <ChessBoard
        fen={startingPosition.fen()}
        selectedSquare={null}
        legalTargets={[]}
        lastMove={null}
        onSquareClick={() => {}}
        boardTheme={boardTheme}
        pieceStyle="realistic"
      />
    </div>
  );

  if (!profile?.id) {
    return (
      <div className="vc-guest-home">
        <section className="vc-home-launch">
          {board}
          <GameLaunchPanel
            heading="Prêt à jouer ?"
            subheading="Choisis une cadence et trouve un adversaire en quelques secondes — sans créer de compte."
            primaryLabel="Jouer maintenant"
            showPicker
            showBoardThemes
            onStart={onStartGame}
            secondaryActions={[
              {
                label: "Jouer avec un ami",
                detail: "Partage un lien et défie un proche",
                icon: <Users aria-hidden="true" />,
                onClick: () => setTab("play"),
              },
              {
                label: "Jouer contre l’ordinateur",
                detail: "Entraîne-toi à ton rythme, sans adversaire",
                icon: <Bot aria-hidden="true" />,
                onClick: () => setTab("computer"),
              },
            ]}
          />
        </section>
      </div>
    );
  }

  const links = [
    {
      title: "Défier un joueur",
      description: "Lancez un défi ou invitez un ami par lien.",
      icon: <Swords aria-hidden="true" />,
      tab: "play" as const,
    },
    {
      title: "Mes parties",
      description: "Retrouvez vos parties et vos résultats.",
      icon: <Gamepad2 aria-hidden="true" />,
      tab: "games" as const,
    },
    {
      title: "Apprendre à jouer",
      description: "Revoyez les règles et progressez pas à pas.",
      icon: <BookOpen aria-hidden="true" />,
      tab: "learn" as const,
    },
    {
      title: "Communauté",
      description: "Retrouvez les joueurs et vos amis.",
      icon: <Users aria-hidden="true" />,
      tab: "friends" as const,
    },
  ];

  return (
    <div className="vc-home-modern">
      <section className="vc-home-launch">
        {board}
        <GameLaunchPanel
          heading={`Bonjour${profile?.username ? `, ${profile.username}` : ""}`}
          meta={ratings ? `${ratings.overallRating} Elo` : undefined}
          subheading={
            hasActiveGame
              ? "Une partie vous attend là où vous l’avez laissée."
              : "Choisissez une cadence et retrouvez un adversaire en quelques secondes."
          }
          primaryLabel={hasActiveGame ? "Reprendre ma partie" : "Jouer maintenant"}
          showPicker={!hasActiveGame}
          onStart={hasActiveGame ? () => setTab("play") : onStartGame}
          secondaryActions={[
            {
              label: "Jouer avec un ami",
              detail: "Partage un lien et défie un proche",
              icon: <Users aria-hidden="true" />,
              onClick: () => setTab("play"),
            },
            {
              label: "Jouer contre l’ordinateur",
              detail: "Entraîne-toi à ton rythme, sans adversaire",
              icon: <Bot aria-hidden="true" />,
              onClick: () => setTab("computer"),
            },
            {
              label: "Tournois",
              detail: "Affrontez la communauté",
              icon: <Trophy aria-hidden="true" />,
              onClick: () => setTab("tournaments"),
            },
          ]}
        />
      </section>

      {error && (
        <p className="vc-home-error" role="status">
          Certaines informations n’ont pas pu être chargées. {error}
        </p>
      )}

      <section className="vc-home-tournaments">
        <div className="vc-home-section-heading">
          <h2>Prochains tournois</h2>
          <button type="button" className="vc-home-text-link" onClick={() => setTab("tournaments")}>
            Voir tout
          </button>
        </div>
        {upcomingTournaments.length > 0 ? (
          <ol className="vc-home-tournament-list">
            {upcomingTournaments.map((tournament, index) => (
              <li className="vc-home-tournament-row" key={tournament.id}>
                <span className="vc-home-tournament-row__index">{String(index + 1).padStart(2, "0")}</span>
                <div className="vc-home-tournament-row__info">
                  <strong>{tournament.name}</strong>
                  <small>
                    {tournament.format === "SWISS" ? "Système suisse" : "Toutes rondes"}
                    {" — "}
                    {new Date(tournament.startsAt).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </small>
                </div>
                <button type="button" onClick={() => setTab("tournaments")}>Voir</button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="vc-home-tournaments-empty">
            <CalendarDays size={19} />
            <span>{loading ? "Chargement des prochains tournois…" : "Aucun tournoi à venir pour le moment."}</span>
          </div>
        )}
      </section>

      <section className="vc-home-discover">
        <div className="vc-home-section-heading">
          <h2>Explorer ChessArena</h2>
        </div>
        <ul className="vc-home-link-list">
          {links.map((link) => (
            <li key={link.title}>
              <button
                type="button"
                className="vc-home-link"
                onClick={() => setTab(link.tab)}
              >
                <span className="vc-home-link__icon">{link.icon}</span>
                <span className="vc-home-link__copy">
                  <strong>{link.title}</strong>
                  <small>{link.description}</small>
                </span>
                <ArrowRight className="vc-home-link__arrow" size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
