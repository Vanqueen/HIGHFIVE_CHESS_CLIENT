import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  LockKeyhole,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { KANEO_PIECES } from "../assets/pieces/kaneo";
import { useAuth } from "../context/AuthContext";
import { trainingRatingApi, type TrainingRatingProgress } from "../api/trainingRatingApi";
import "./LearnPage.css";

type TutorialStep = {
  title: string;
  instruction: string;
  explanation: string;
  from: string;
  to: string;
  position: Record<string, string>;
  piece: string;
  promotion?: string;
  success: string;
};

const files = "abcdefgh".split("");
const ranks = "87654321".split("");

const pawnSteps: TutorialStep[] = [
  {
    title: "Avancer d’une case",
    instruction: "Fais avancer le pion blanc de e2 vers e3.",
    explanation: "Le pion avance tout droit d’une case. Il ne peut pas reculer.",
    from: "e2",
    to: "e3",
    position: { e2: "wP" },
    piece: "wP",
    success: "Bien joué ! Le pion avance d’une case tout droit.",
  },
  {
    title: "Avancer de deux cases",
    instruction: "Au premier coup, avance le pion de e2 jusqu’à e4.",
    explanation: "Depuis sa case de départ, un pion peut avancer d’une ou de deux cases si le chemin est libre.",
    from: "e2",
    to: "e4",
    position: { e2: "wP" },
    piece: "wP",
    success: "Exact ! Le pion peut avancer de deux cases lors de son premier déplacement.",
  },
  {
    title: "Capturer en diagonale",
    instruction: "Capture le pion noir en déplaçant le pion blanc de e4 vers d5.",
    explanation: "Le pion avance droit, mais il capture une pièce adverse d’une case en diagonale vers l’avant.",
    from: "e4",
    to: "d5",
    position: { e4: "wP", d5: "bP" },
    piece: "wP",
    success: "Bravo ! Le pion a capturé en diagonale. Il n’avance jamais en diagonale sur une case vide.",
  },
];

const lessons = [
  { id: "pawn", title: "Déplacer un pion", description: "Avancer, faire le premier double pas et capturer.", duration: "3 étapes", ratingPoints: 40, available: true },
  { id: "knight", title: "Déplacer le cavalier", description: "Comprendre le déplacement en L et les sauts.", duration: "2 étapes", ratingPoints: 55, available: true },
  { id: "bishop", title: "Déplacer le fou", description: "Se déplacer en diagonale et garder les lignes ouvertes.", duration: "2 étapes", ratingPoints: 60, available: true },
  { id: "rook", title: "Déplacer la tour", description: "Avancer sur les rangées et les colonnes.", duration: "2 étapes", ratingPoints: 65, available: true },
  { id: "queen", title: "Déplacer la dame", description: "Combiner les déplacements de la tour et du fou.", duration: "2 étapes", ratingPoints: 85, available: true },
  { id: "king", title: "Déplacer le roi", description: "Bouger d’une case et éviter les cases attaquées.", duration: "2 étapes", ratingPoints: 90, available: true },
  { id: "check", title: "Échec et protection du roi", description: "Reconnaître un échec et trouver une réponse légale.", duration: "2 étapes", ratingPoints: 105, available: true },
];
const intermediateLessons = [
  { id: "intermediateTactics", title: "La fourchette", description: "Attaquer deux pièces en un seul coup.", duration: "2 étapes", ratingPoints: 100, available: true },
  { id: "intermediateStrategy", title: "Le pion passé", description: "Faire progresser un pion jusqu’à la promotion.", duration: "3 étapes", ratingPoints: 100, available: true },
  { id: "intermediateEndgames", title: "Le roi actif en finale", description: "Centraliser le roi pour soutenir ses pions.", duration: "2 étapes", ratingPoints: 100, available: true },
];
const advancedLessons = [
  { id: "advancedCalculation", title: "Calculer une suite d’échecs", description: "Enchaîner des coups forcés pour garder l’initiative.", duration: "2 étapes", ratingPoints: 150, available: true },
  { id: "advancedPin", title: "Exploiter un clouage", description: "Immobiliser une pièce puis profiter de sa faiblesse.", duration: "2 étapes", ratingPoints: 175, available: true },
  { id: "advancedEndgames", title: "La tour derrière le pion passé", description: "Placer la tour pour soutenir la promotion du pion.", duration: "2 étapes", ratingPoints: 200, available: true },
];
const allLessons = [...lessons, ...intermediateLessons, ...advancedLessons];
const FINAL_BEGINNER_LESSON_UNLOCK_RATING = 220;
const INTERMEDIATE_LEVEL_UNLOCK_RATING = 500;
const ADVANCED_LEVEL_UNLOCK_RATING = 800;
const RATING_LOCKED_BEGINNER_LESSONS = new Set(["queen", "king", "check"]);

const lessonTutorials: Record<string, TutorialStep[]> = {
  pawn: pawnSteps,
  knight: [
    { title: "Le saut en L", instruction: "Déplace le cavalier blanc de g1 vers f3.", explanation: "Le cavalier avance de deux cases dans une direction, puis d’une case sur le côté. Il peut sauter par-dessus les autres pièces.", from: "g1", to: "f3", position: { g1: "wN" }, piece: "wN", success: "Bien joué ! Le cavalier a effectué son déplacement en L." },
    { title: "Sauter au-dessus des pièces", instruction: "Depuis f3, déplace le cavalier vers e5.", explanation: "Le cavalier est la seule pièce qui peut sauter au-dessus des pièces placées sur son chemin.", from: "f3", to: "e5", position: { f3: "wN", f2: "wP", e2: "wP", g2: "wP" }, piece: "wN", success: "Exact ! Les pièces autour du cavalier ne bloquent pas son saut." },
  ],
  bishop: [
    { title: "Suivre une diagonale", instruction: "Déplace le fou blanc de f1 vers c4.", explanation: "Le fou se déplace en diagonale, aussi loin que le chemin est libre.", from: "f1", to: "c4", position: { f1: "wB" }, piece: "wB", success: "Bien joué ! Le fou a suivi une diagonale." },
    { title: "Capturer sur la diagonale", instruction: "Depuis c4, capture le pion noir en f7.", explanation: "Le fou capture comme il se déplace : en diagonale, sans traverser d’autre pièce.", from: "c4", to: "f7", position: { c4: "wB", f7: "bP" }, piece: "wB", success: "Exact ! Le fou a capturé une pièce sur sa diagonale." },
  ],
  rook: [
    { title: "Avancer sur une colonne", instruction: "Déplace la tour de a1 vers a4.", explanation: "La tour se déplace en ligne droite, sur une rangée ou une colonne.", from: "a1", to: "a4", position: { a1: "wR" }, piece: "wR", success: "Bien joué ! La tour a avancé sur la colonne a." },
    { title: "Parcourir une rangée", instruction: "Depuis a4, déplace la tour vers h4.", explanation: "La tour peut parcourir toute une rangée si aucune pièce ne bloque son chemin.", from: "a4", to: "h4", position: { a4: "wR", h4: "bP" }, piece: "wR", success: "Exact ! La tour s’est déplacée sur la rangée et a capturé le pion." },
  ],
  queen: [
    { title: "Comme une tour", instruction: "Déplace la dame de d1 vers d4.", explanation: "La dame peut se déplacer en ligne droite, comme une tour.", from: "d1", to: "d4", position: { d1: "wQ" }, piece: "wQ", success: "Bien joué ! La dame a avancé sur la colonne d." },
    { title: "Comme un fou", instruction: "Depuis d4, déplace la dame en diagonale vers h8.", explanation: "La dame combine les déplacements de la tour et du fou : elle peut aussi suivre une diagonale.", from: "d4", to: "h8", position: { d4: "wQ" }, piece: "wQ", success: "Exact ! La dame peut se déplacer aussi bien en ligne droite qu’en diagonale." },
  ],
  king: [
    { title: "Une case à la fois", instruction: "Déplace le roi blanc de e1 vers e2.", explanation: "Le roi se déplace d’une seule case dans n’importe quelle direction.", from: "e1", to: "e2", position: { e1: "wK" }, piece: "wK", success: "Bien joué ! Le roi a avancé d’une case." },
    { title: "Changer de direction", instruction: "Depuis e2, déplace le roi en diagonale vers d3.", explanation: "Le roi peut aussi se déplacer en diagonale d’une case, tant que la case n’est pas attaquée.", from: "e2", to: "d3", position: { e2: "wK" }, piece: "wK", success: "Exact ! Le roi peut avancer d’une case en diagonale." },
  ],
  check: [
    { title: "Sortir de l’échec", instruction: "Le roi blanc est attaqué par la tour noire. Mets-le en sécurité en f1.", explanation: "Quand le roi est en échec, il faut répondre tout de suite : le déplacer, capturer l’attaquant ou bloquer l’attaque.", from: "e1", to: "f1", position: { e1: "wK", e8: "bR" }, piece: "wK", success: "Bien joué ! Le roi a quitté la colonne attaquée et n’est plus en échec." },
    { title: "Échapper à une attaque", instruction: "La tour noire attaque le roi sur la colonne h. Déplace le roi de h1 vers g1.", explanation: "Avant de déplacer le roi, vérifie que la case d’arrivée n’est pas attaquée par une pièce adverse.", from: "h1", to: "g1", position: { h1: "wK", h8: "bR" }, piece: "wK", success: "Exact ! Le roi a quitté la colonne attaquée." },
  ],
  intermediateTactics: [
    { title: "Créer une fourchette", instruction: "Déplace le cavalier de f2 vers e4 : il attaquera le roi et la tour noirs.", explanation: "Une fourchette est une attaque double. Ici, le cavalier donne échec au roi en d6 tout en attaquant la tour en f6.", from: "f2", to: "e4", position: { f2: "wN", d6: "bK", f6: "bR" }, piece: "wN", success: "Bien joué ! Le cavalier attaque deux pièces à la fois. Le roi doit répondre à l’échec." },
    { title: "Récupérer la pièce attaquée", instruction: "Le roi noir s’est écarté en c7. Capture la tour avec le cavalier en f6.", explanation: "Après la réponse à l’échec, la tour reste attaquée. Le cavalier peut maintenant la capturer.", from: "e4", to: "f6", position: { e4: "wN", c7: "bK", f6: "bR" }, piece: "wN", success: "Exact ! La fourchette a permis de gagner la tour." },
  ],
  intermediateStrategy: [
    { title: "Faire avancer le pion passé", instruction: "Avance le pion blanc de e5 vers e6.", explanation: "Un pion passé n’a plus de pion adverse pour l’arrêter sur sa colonne ou sur les colonnes voisines. Il peut devenir une dame s’il avance jusqu’au bout.", from: "e5", to: "e6", position: { e5: "wP", h8: "bK" }, piece: "wP", success: "Bien joué ! Le pion passé gagne du terrain." },
    { title: "Approcher de la promotion", instruction: "Poursuis l’avancée de e6 vers e7.", explanation: "Le pion approche de la dernière rangée. Garde-le soutenu et prépare sa promotion.", from: "e6", to: "e7", position: { e6: "wP", h8: "bK" }, piece: "wP", success: "Exact ! Le pion est à une case de la promotion." },
    { title: "Promouvoir le pion", instruction: "Avance le pion de e7 vers e8 pour le promouvoir en dame.", explanation: "Quand un pion atteint la dernière rangée, il doit être remplacé par une dame, une tour, un fou ou un cavalier.", from: "e7", to: "e8", position: { e7: "wP", h8: "bK" }, piece: "wP", promotion: "wQ", success: "Bravo ! Le pion a atteint la dernière rangée et est devenu une dame." },
  ],
  intermediateEndgames: [
    { title: "Activer le roi", instruction: "Avance le roi blanc de e2 vers e3, en direction du centre.", explanation: "En finale, le roi devient une pièce active. Il peut quitter son abri et aider ses pions à avancer.", from: "e2", to: "e3", position: { e2: "wK", a7: "bK" }, piece: "wK", success: "Bien joué ! Le roi se rapproche du centre." },
    { title: "Entrer dans la position", instruction: "Depuis e3, avance le roi vers d4.", explanation: "Un roi centralisé peut soutenir ses pions et limiter les déplacements du roi adverse.", from: "e3", to: "d4", position: { e3: "wK", a7: "bK" }, piece: "wK", success: "Exact ! Le roi blanc est actif au centre de l’échiquier." },
  ],
  advancedCalculation: [
    { title: "Donner un échec", instruction: "Joue la dame de h5 en f7 pour mettre le roi noir en échec.", explanation: "La dame en f7 donne échec au roi en g8. Le fou en c4 protège la dame contre une capture du roi.", from: "h5", to: "f7", position: { h5: "wQ", c4: "wB", f7: "bP", g8: "bK" }, piece: "wQ", success: "Bien joué ! La dame donne échec et le fou la protège." },
    { title: "Poursuivre les coups forcés", instruction: "Le roi s’est réfugié en h8. Déplace la dame de f7 vers e8 pour donner un nouvel échec.", explanation: "Après la réponse adverse, cherche le prochain échec : les coups forcés limitent les options de défense.", from: "f7", to: "e8", position: { f7: "wQ", h8: "bK" }, piece: "wQ", success: "Exact ! La dame en e8 attaque le roi sur la rangée huit." },
  ],
  advancedPin: [
    { title: "Créer un clouage absolu", instruction: "Place le fou de c4 en b5. Le cavalier noir est cloué devant son roi.", explanation: "Le fou attaque le cavalier c6 et le roi e8 derrière lui. Le cavalier ne peut pas bouger sans exposer son roi à l’échec.", from: "c4", to: "b5", position: { c4: "wB", c6: "bN", e8: "bK" }, piece: "wB", success: "Bien joué ! Le cavalier est cloué au roi par le fou." },
    { title: "Gagner la pièce clouée", instruction: "Capture le cavalier avec le fou en allant de b5 vers c6.", explanation: "Une pièce clouée est plus difficile à défendre. Le fou peut maintenant la capturer.", from: "b5", to: "c6", position: { b5: "wB", c6: "bN", e8: "bK" }, piece: "wB", success: "Exact ! Le fou a capturé le cavalier cloué." },
  ],
  advancedEndgames: [
    { title: "Placer la tour derrière le pion", instruction: "Amène la tour blanche de a1 en a4, derrière le pion passé a6.", explanation: "Une tour est souvent plus efficace derrière son pion passé : elle peut le pousser tout en le protégeant.", from: "a1", to: "a4", position: { a1: "wR", a6: "wP", h8: "bK" }, piece: "wR", success: "Bien joué ! La tour soutient maintenant le pion par derrière." },
    { title: "Pousser le pion soutenu", instruction: "Avance le pion de a6 vers a7.", explanation: "Avec la tour derrière lui, le pion peut avancer vers la promotion tout en restant soutenu.", from: "a6", to: "a7", position: { a4: "wR", a6: "wP", h8: "bK" }, piece: "wP", success: "Exact ! Le pion avance, soutenu par sa tour." },
  ],
};

const LESSON_PIECES: Record<string, string> = {
  pawn: "wP", knight: "wN", bishop: "wB", rook: "wR", queen: "wQ", king: "wK", check: "bK",
  intermediateTactics: "wN", intermediateStrategy: "wP", intermediateEndgames: "wK",
  advancedCalculation: "wQ", advancedPin: "wB", advancedEndgames: "wR",
};
const PIECE_NAMES: Record<string, string> = { K: "roi", Q: "dame", R: "tour", B: "fou", N: "cavalier", P: "pion" };
const pieceLabel = (piece: string) => `${PIECE_NAMES[piece[1]]} ${piece[0] === "w" ? "blanc" : "noir"}`;

function TrainingEloCard({
  progress,
  gain,
  authenticated,
  loading,
  error,
  loadingLabel,
  username,
  avatarUrl,
  headerSummary = false,
  onRetry,
  onSignIn,
}: {
  progress: TrainingRatingProgress | null;
  gain: number | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  loadingLabel: string;
  username?: string;
  avatarUrl?: string;
  headerSummary?: boolean;
  onRetry?: () => void;
  onSignIn: () => void;
}) {
  const rank = progress
    ? progress.rating >= 1400 ? "Expert" : progress.rating >= 1100 ? "Confirmé" : progress.rating >= 500 ? "Intermédiaire" : "Débutant"
    : null;
  return (
    <section className={`vc-learn__elo${headerSummary ? " vc-learn__elo--header" : ""}`} aria-label="Classement Elo d’entraînement">
      {username && (
        <span className="vc-learn__elo-user">
          <span className="vc-learn__elo-avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : username.charAt(0).toUpperCase()}
          </span>
          <strong title={username}>{username}</strong>
        </span>
      )}
      <span className="vc-learn__elo-icon"><TrendingUp size={19} /></span>
      <span className="vc-learn__elo-copy">
        <strong>Elo d’entraînement</strong>
        <small>
          {!authenticated
            ? "Connecte-toi pour enregistrer ta progression."
            : loading
              ? loadingLabel
              : error
                ? error
                : `${rank} · ${progress?.lessonsCompleted ?? 0} leçon${progress?.lessonsCompleted === 1 ? " terminée" : "s terminées"}`}
        </small>
      </span>
      {!authenticated ? (
        <button className="vc-learn__elo-action" type="button" onClick={onSignIn}>Se connecter</button>
      ) : error ? (
        onRetry && <button className="vc-learn__elo-action" type="button" onClick={onRetry}>Réessayer</button>
      ) : loading ? (
        <span className="vc-learn__elo-loading" aria-hidden="true" />
      ) : (
        <>
          <strong className="vc-learn__elo-score">{progress?.rating ?? "—"}</strong>
          {gain !== null && <span className="vc-learn__elo-gain">+{gain} Elo</span>}
        </>
      )}
    </section>
  );
}

function LessonIllustration({ lessonId }: { lessonId: string }) {
  return (
    <span className={`vc-learn__lesson-art is-${lessonId}`} aria-hidden="true">
      <span className="vc-learn__lesson-art-board" />
      <span className="vc-learn__lesson-art-piece" dangerouslySetInnerHTML={{ __html: KANEO_PIECES[LESSON_PIECES[lessonId]] }} />
    </span>
  );
}

type LevelIllustrationProps = {
  level: "beginner" | "intermediate" | "advanced";
};

const LEVEL_ART: Record<LevelIllustrationProps["level"], { pieces: Record<number, string>; hero: string; number: string }> = {
  beginner: {
    pieces: { 0: "bR", 3: "bK", 5: "bP", 6: "bP", 9: "wP", 10: "wP", 12: "wP", 15: "wK" },
    hero: "wN",
    number: "01",
  },
  intermediate: {
    pieces: { 0: "bK", 2: "bR", 5: "bP", 6: "wQ", 9: "bN", 10: "wB", 13: "wP", 15: "wK" },
    hero: "wQ",
    number: "02",
  },
  advanced: {
    pieces: { 1: "bK", 4: "bR", 7: "bP", 8: "wP", 11: "wB", 13: "wR", 14: "wP" },
    hero: "wK",
    number: "03",
  },
};

function LevelIllustration({ level }: LevelIllustrationProps) {
  const art = LEVEL_ART[level];
  return (
    <span className={`vc-learn__level-art is-${level}`} aria-hidden="true">
      <span className="vc-learn__level-art-label">PARCOURS {art.number}</span>
      <span className="vc-learn__level-mini-board">
        {Array.from({ length: 16 }, (_, square) => {
          const piece = art.pieces[square];
          return (
            <span key={square} className={`vc-learn__level-mini-square${(Math.floor(square / 4) + square % 4) % 2 ? " is-dark" : ""}`}>
              {piece && <span dangerouslySetInnerHTML={{ __html: KANEO_PIECES[piece] }} />}
            </span>
          );
        })}
      </span>
      <span className="vc-learn__level-hero-piece" dangerouslySetInnerHTML={{ __html: KANEO_PIECES[art.hero] }} />
      <span className="vc-learn__level-art-caption">CHESSARENA <i /> APPRENDRE</span>
    </span>
  );
}

export default function LearnPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainingProgress, setTrainingProgress] = useState<TrainingRatingProgress | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(Boolean(user));
  const [trainingSaving, setTrainingSaving] = useState(false);
  const [trainingLoadError, setTrainingLoadError] = useState<string | null>(null);
  const [trainingSaveError, setTrainingSaveError] = useState<string | null>(null);
  const [trainingLoadAttempt, setTrainingLoadAttempt] = useState(0);
  const [lastEloGain, setLastEloGain] = useState<number | null>(null);
  const [view, setView] = useState<"levels" | "lessons" | "tutorial">("levels");
  const [activeLevel, setActiveLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [activeLessonId, setActiveLessonId] = useState("pawn");
  const [stepIndex, setStepIndex] = useState(0);
  const [board, setBoard] = useState<Record<string, string>>({});
  const [lessonMoves, setLessonMoves] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [stepComplete, setStepComplete] = useState(false);
  const [feedback, setFeedback] = useState("");
  const activeCourseLessons = activeLevel === "beginner" ? lessons : activeLevel === "intermediate" ? intermediateLessons : advancedLessons;
  const activeLesson = allLessons.find((lesson) => lesson.id === activeLessonId) ?? lessons[0];
  const activeSteps = lessonTutorials[activeLesson.id] ?? pawnSteps;
  const step = activeSteps[stepIndex];
  const specialCoursesUnlocked = trainingProgress?.specialCoursesUnlocked ?? false;
  const specialCoursesUnlockRating = trainingProgress?.specialCoursesUnlockRating ?? null;
  const specialCoursesProgress = specialCoursesUnlockRating
    ? Math.min(100, Math.round(((trainingProgress?.rating ?? 0) / specialCoursesUnlockRating) * 100))
    : 0;
  const advancedRating = trainingProgress?.rating ?? 0;
  const intermediateUnlocked = Boolean(user) && !trainingLoading && !trainingLoadError && advancedRating >= INTERMEDIATE_LEVEL_UNLOCK_RATING;
  const advancedUnlocked = Boolean(user) && !trainingLoading && !trainingLoadError && advancedRating >= ADVANCED_LEVEL_UNLOCK_RATING;
  const intermediateStatus = !user
    ? "CONNEXION REQUISE"
    : trainingLoading
      ? "CHARGEMENT DU CLASSEMENT"
      : trainingLoadError
        ? "PROGRESSION INDISPONIBLE"
        : intermediateUnlocked
          ? "3 LEÇONS · 300 ELO"
          : `${INTERMEDIATE_LEVEL_UNLOCK_RATING} ELO REQUIS`;
  const advancedStatus = !user
    ? "CONNEXION REQUISE"
    : trainingLoading
      ? "CHARGEMENT DU CLASSEMENT"
      : trainingLoadError
        ? "PROGRESSION INDISPONIBLE"
        : advancedUnlocked
          ? "3 LEÇONS · 525 ELO"
          : `${ADVANCED_LEVEL_UNLOCK_RATING} ELO REQUIS`;
  const goToSignIn = () => navigate(`/auth?mode=signin&next=${encodeURIComponent("/?tab=learn")}`);

  useEffect(() => {
    if (!user) {
      setTrainingProgress(null);
      setTrainingLoading(false);
      setTrainingLoadError(null);
      return;
    }

    let active = true;
    setTrainingLoading(true);
    setTrainingLoadError(null);
    trainingRatingApi.getProgress()
      .then((progress) => {
        if (active) setTrainingProgress(progress);
      })
      .catch(() => {
        if (active) setTrainingLoadError("Impossible de charger le classement.");
      })
      .finally(() => {
        if (active) setTrainingLoading(false);
      });

    return () => { active = false; };
  }, [user?.id, trainingLoadAttempt]);

  const openLessonTutorial = (lessonId: string) => {
    const nextSteps = lessonTutorials[lessonId] ?? pawnSteps;
    setActiveLessonId(lessonId);
    setLastEloGain(null);
    setTrainingSaveError(null);
    setLessonMoves([]);
    setStepIndex(0);
    setBoard(nextSteps[0].position);
    setSelectedSquare(null);
    setStepComplete(false);
    setFeedback("");
    setView("tutorial");
  };

  const resetStep = () => {
    setBoard(step.position);
    setSelectedSquare(null);
    setStepComplete(false);
    setFeedback("");
  };

  const selectSquare = (square: string) => {
    if (stepComplete) return;
    if (square === step.from && board[square] === step.piece) {
      setSelectedSquare(square);
      setFeedback(`${PIECE_NAMES[step.piece[1]]} sélectionné. Clique maintenant sur la case indiquée.`);
      return;
    }

    if (selectedSquare === step.from) {
      if (square === step.to) {
        setBoard((current) => {
          const next = { ...current };
          delete next[step.from];
          next[step.to] = step.piece;
          return next;
        });
        setSelectedSquare(null);
        setStepComplete(true);
        setLessonMoves((moves) => [...moves.slice(0, stepIndex), `${step.from}${step.to}`]);
        setFeedback(step.success);
      } else {
        setFeedback("Ce n’est pas la bonne case. Suis l’indication sur l’échiquier et réessaie.");
      }
      return;
    }

    setFeedback(`Clique d’abord sur le ${PIECE_NAMES[step.piece[1]]} blanc pour le sélectionner.`);
  };

  const advanceStep = async () => {
    if (stepIndex === activeSteps.length - 1) {
      if (!user) {
        setView("lessons");
        return;
      }

      setTrainingSaving(true);
      setTrainingSaveError(null);
      setTrainingLoadError(null);
      try {
        const result = await trainingRatingApi.completeLesson(activeLesson.id, lessonMoves);
        setTrainingProgress({
          rating: result.rating,
          lessonsCompleted: result.lessonsCompleted,
          completedLessons: result.completedLessons,
          specialCoursesUnlocked: result.specialCoursesUnlocked,
          specialCoursesUnlockRating: result.specialCoursesUnlockRating,
        });
        setLastEloGain(result.ratingChange > 0 ? result.ratingChange : null);
        setView("lessons");
      } catch {
        setTrainingSaveError("La leçon est terminée, mais ton Elo n’a pas pu être enregistré.");
      } finally {
        setTrainingSaving(false);
      }
      return;
    }
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    setBoard(activeSteps[nextIndex].position);
    setSelectedSquare(null);
    setStepComplete(false);
    setFeedback("");
  };

  if (view === "tutorial") {
    const isLastStep = stepIndex === activeSteps.length - 1;
    return (
      <main className="vc-learn">
        <button className="vc-learn__back" type="button" onClick={() => setView("lessons")}><ArrowLeft size={16} /> Retour aux leçons</button>
        <section className="vc-learn__tutorial" aria-labelledby="vc-learn-tutorial-title">
          <div className="vc-learn__tutorial-top">
            <div className="vc-learn__tutorial-heading">
              <div><p className="vc-learn__eyebrow">TUTORIEL · {activeLesson.title.toLocaleUpperCase("fr")}</p><h1 id="vc-learn-tutorial-title">{step.title}</h1><p>{step.instruction}</p></div>
              <span className="vc-learn__step-count">Étape {stepIndex + 1} sur {activeSteps.length}</span>
            </div>
            <TrainingEloCard
              progress={trainingProgress}
              gain={lastEloGain}
              authenticated={Boolean(user)}
              loading={trainingLoading || trainingSaving}
              loadingLabel={trainingSaving ? "Enregistrement de ta progression…" : "Chargement de ton classement…"}
              error={trainingSaveError || trainingLoadError}
              username={user?.username}
              avatarUrl={user?.avatarUrl}
              headerSummary
              onRetry={trainingLoadError ? () => setTrainingLoadAttempt((attempt) => attempt + 1) : undefined}
              onSignIn={goToSignIn}
            />
          </div>
          <div className="vc-learn__progress" aria-label={`Progression : étape ${stepIndex + 1} sur ${activeSteps.length}`}><span style={{ width: `${((stepIndex + (stepComplete ? 1 : 0)) / activeSteps.length) * 100}%` }} /></div>

          <div className="vc-learn__lesson-layout">
            <div className="vc-learn__board-wrap">
              <div className="vc-learn__board" role="group" aria-label={`Échiquier du tutoriel : ${activeLesson.title}`}>
                {ranks.flatMap((rank, row) => files.map((file, column) => {
                  const square = `${file}${rank}`;
                  const isLight = (row + column) % 2 === 0;
                  const piece = board[square];
                  const isSource = square === step.from && !stepComplete;
                  const isTarget = square === step.to && !stepComplete;
                  const classes = ["vc-learn__square", isLight ? "is-light" : "is-dark", isSource ? "is-source" : "", isTarget ? "is-target" : "", selectedSquare === square ? "is-selected" : "", stepComplete && square === step.to ? "is-complete" : ""].filter(Boolean).join(" ");
                  return <button key={square} type="button" className={classes} onClick={() => selectSquare(square)} aria-label={`Case ${square}${piece ? `, ${pieceLabel(piece)}` : ""}${isTarget ? ", case conseillée" : ""}`} aria-pressed={selectedSquare === square}>
                    {column === 0 && <span className="vc-learn__rank" aria-hidden="true">{rank}</span>}
                    {row === 7 && <span className="vc-learn__file" aria-hidden="true">{file}</span>}
                    {piece && <span className={`vc-learn__piece ${piece[0] === "w" ? "is-white" : "is-black"}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: KANEO_PIECES[piece] }} />}
                  </button>;
                }))}
                {!stepComplete && (
                  <svg className="vc-learn__hint-arrow" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <defs><marker id="vc-learn-arrow-head" markerWidth="4" markerHeight="4" refX="3.2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" /></marker></defs>
                    <line x1={`${(step.from.charCodeAt(0) - 96.5) * 12.5}`} y1={`${(8.5 - Number(step.from[1])) * 12.5}`} x2={`${(step.to.charCodeAt(0) - 96.5) * 12.5}`} y2={`${(8.5 - Number(step.to[1])) * 12.5}`} markerEnd="url(#vc-learn-arrow-head)" />
                  </svg>
                )}
              </div>
              <div className="vc-learn__board-legend"><span><i className="is-origin" /> Départ</span><span><i className="is-destination" /> Case à jouer</span></div>
            </div>

            <aside className="vc-learn__coach">
              <span className="vc-learn__coach-icon"><BookOpen size={19} /></span>
              <p className="vc-learn__eyebrow">À COMPRENDRE</p>
              <h2>{step.title}</h2>
              <p className="vc-learn__coach-copy">{step.explanation}</p>
              <div className={`vc-learn__feedback${stepComplete ? " is-success" : ""}`} role="status" aria-live="polite">
                {stepComplete ? <CheckCircle2 size={17} /> : <CircleHelp size={17} />}
                <span>{feedback || "Clique sur le pion blanc, puis sur la case qui clignote pour effectuer le coup."}</span>
              </div>
              <div className="vc-learn__coach-actions">
                <button className="vc-learn__reset" type="button" onClick={resetStep}><RotateCcw size={15} /> Recommencer</button>
                {stepComplete && <button className="vc-learn__continue" type="button" disabled={trainingSaving} onClick={advanceStep}>{trainingSaving ? "Enregistrement…" : isLastStep ? "Terminer la leçon" : "Étape suivante"}<ArrowRight size={16} /></button>}
              </div>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  if (view === "lessons") {
    return (
      <main className="vc-learn">
        <button className="vc-learn__back" type="button" onClick={() => setView("levels")}><ArrowLeft size={16} /> Tous les niveaux</button>
        <div className="vc-learn__intro-row">
          <header className="vc-learn__header">
            <p className="vc-learn__eyebrow"><GraduationCap size={14} /> PARCOURS {activeLevel === "beginner" ? "DÉBUTANT" : activeLevel === "intermediate" ? "INTERMÉDIAIRE" : "AVANCÉ"}</p>
            <h1>{activeLevel === "beginner" ? "Choisis ta leçon" : activeLevel === "intermediate" ? "Affûte ta stratégie" : "Maîtrise les positions complexes"}</h1>
            <p>{activeLevel === "beginner" ? "Chaque leçon te guide sur l’échiquier, coup après coup." : activeLevel === "intermediate" ? "Mets en pratique les tactiques, les pions passés et le jeu du roi en finale." : "Calcule les variantes, exploite les faiblesses et convertis tes avantages."}</p>
          </header>
          <TrainingEloCard
            progress={trainingProgress}
            gain={lastEloGain}
            authenticated={Boolean(user)}
            loading={trainingLoading}
            loadingLabel="Chargement de ton classement…"
            error={trainingLoadError}
            username={user?.username}
            avatarUrl={user?.avatarUrl}
            headerSummary
            onRetry={() => setTrainingLoadAttempt((attempt) => attempt + 1)}
            onSignIn={goToSignIn}
          />
        </div>
        <div className="vc-learn__lessons">
          {activeCourseLessons.map((lesson) => {
            const requiresLogin = activeLevel !== "beginner" || lesson.id !== "pawn";
            const requiresRating = RATING_LOCKED_BEGINNER_LESSONS.has(lesson.id);
            const rating = trainingProgress?.rating ?? 0;
            const ratingLoaded = !trainingLoading && !trainingLoadError;
            const ratingLocked = requiresRating && Boolean(user) && (!ratingLoaded || rating < FINAL_BEGINNER_LESSON_UNLOCK_RATING);
            const lessonAccessible = lesson.available && (!requiresLogin || Boolean(user)) && !ratingLocked;
            const status = !user && requiresLogin
              ? "Connexion requise"
              : ratingLocked && trainingLoading
                ? "Chargement du classement…"
                : ratingLocked && trainingLoadError
                  ? "Progression indisponible"
                  : ratingLocked
                    ? `${FINAL_BEGINNER_LESSON_UNLOCK_RATING} Elo requis · ${rating}/${FINAL_BEGINNER_LESSON_UNLOCK_RATING}`
                    : lesson.duration;

            return (
              <button
                className={`vc-learn__lesson-card${lessonAccessible ? " is-available" : " is-locked"}`}
                key={lesson.id}
                type="button"
                disabled={Boolean(user) && (!lesson.available || ratingLocked)}
                onClick={() => {
                  if (!user && requiresLogin) goToSignIn();
                  else if (lessonAccessible) openLessonTutorial(lesson.id);
                }}
              >
                <LessonIllustration lessonId={lesson.id} />
                <span className="vc-learn__lesson-copy"><strong>{lesson.title}</strong><small>{lesson.description}</small></span>
                <span className="vc-learn__lesson-meta">
                  {!lessonAccessible && <LockKeyhole size={13} />}
                  {status} · +{lesson.ratingPoints} Elo
                </span>
                {lessonAccessible && <ChevronRight className="vc-learn__lesson-arrow" size={17} />}
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="vc-learn">
      <div className="vc-learn__intro-row">
        <header className="vc-learn__header">
          <p className="vc-learn__eyebrow"><GraduationCap size={14} /> APPRENDRE À JOUER</p>
          <h1>Choisis ton niveau</h1>
          <p>Des leçons interactives pour progresser à ton rythme, directement sur l’échiquier.</p>
        </header>
        <TrainingEloCard
          progress={trainingProgress}
          gain={lastEloGain}
          authenticated={Boolean(user)}
          loading={trainingLoading}
          loadingLabel="Chargement de ton classement…"
          error={trainingLoadError}
          username={user?.username}
          avatarUrl={user?.avatarUrl}
          headerSummary
          onRetry={() => setTrainingLoadAttempt((attempt) => attempt + 1)}
          onSignIn={goToSignIn}
        />
      </div>
      <section className="vc-learn__levels" aria-label="Niveaux d’apprentissage">
        <button type="button" className="vc-learn__level-card is-available" onClick={() => { setActiveLevel("beginner"); setView("lessons"); }}>
          <LevelIllustration level="beginner" />
          <span className="vc-learn__level-copy">
            <span className="vc-learn__level-tag">POUR BIEN COMMENCER</span>
            <span className="vc-learn__level-title-row">
              <strong>Débutant</strong>
              <span className="vc-learn__level-points">+500 Elo</span>
            </span>
            <span className="vc-learn__level-description">Découvre les pièces, leurs déplacements et les premiers réflexes du jeu.</span>
            <span className="vc-learn__level-footer">Voir les leçons <ArrowRight size={16} /></span>
          </span>
        </button>
        <button
          type="button"
          className={`vc-learn__level-card${intermediateUnlocked ? " is-available" : " is-upcoming"}`}
          disabled={Boolean(user) && !intermediateUnlocked}
          onClick={() => {
            if (!user) goToSignIn();
            else if (intermediateUnlocked) {
              setActiveLevel("intermediate");
              setView("lessons");
            }
          }}
          aria-label={intermediateUnlocked ? "Accéder au niveau Intermédiaire" : !user ? "Connectez-vous pour accéder au niveau Intermédiaire" : `Terminez le parcours Débutant et atteignez ${INTERMEDIATE_LEVEL_UNLOCK_RATING} Elo pour accéder au niveau Intermédiaire`}
        >
          <LevelIllustration level="intermediate" />
          <span className="vc-learn__level-copy">
            <span className="vc-learn__level-tag">{intermediateStatus}</span>
            <strong>Intermédiaire</strong>
            <span className="vc-learn__level-description">Travaille les combinaisons, les plans et les finales courantes. Termine les leçons débutantes pour y accéder.</span>
            <span className="vc-learn__level-footer">
              {intermediateUnlocked ? <>Voir les leçons <ArrowRight size={16} /></> : !user ? <>Se connecter pour accéder <ArrowRight size={15} /></> : <><LockKeyhole size={14} /> {trainingLoadError ? "Réessaie le chargement" : `${advancedRating}/${INTERMEDIATE_LEVEL_UNLOCK_RATING} Elo`}</>}
            </span>
          </span>
        </button>
        <button
          type="button"
          className={`vc-learn__level-card${advancedUnlocked ? " is-available" : " is-upcoming"}`}
          disabled={Boolean(user) && !advancedUnlocked}
          onClick={() => {
            if (!user) goToSignIn();
            else if (advancedUnlocked) {
              setActiveLevel("advanced");
              setView("lessons");
            }
          }}
          aria-label={advancedUnlocked ? "Accéder au niveau Avancé" : !user ? "Connectez-vous pour accéder au niveau Avancé" : `Atteignez ${ADVANCED_LEVEL_UNLOCK_RATING} Elo pour accéder au niveau Avancé`}
        >
          <LevelIllustration level="advanced" />
          <span className="vc-learn__level-copy">
            <span className="vc-learn__level-tag">{advancedStatus}</span>
            <strong>Avancé</strong>
            <span className="vc-learn__level-description">Calcule les variantes, exploite les clouages et maîtrise les finales de tours.</span>
            <span className="vc-learn__level-footer">
              {advancedUnlocked ? <>Voir les leçons <ArrowRight size={16} /></> : !user ? <>Se connecter pour accéder <ArrowRight size={15} /></> : <><LockKeyhole size={14} /> {trainingLoadError ? "Réessaie le chargement" : `${advancedRating}/${ADVANCED_LEVEL_UNLOCK_RATING} Elo`}</>}
            </span>
          </span>
        </button>
      </section>
      <section className="vc-learn__special-section" aria-labelledby="vc-learn-special-title">
        <header className="vc-learn__special-heading">
          <div>
            <p className="vc-learn__eyebrow">PARCOURS À DÉBLOQUER</p>
            <h2 id="vc-learn-special-title">Règles et coups spéciaux</h2>
            <p>Explore les règles et les coups qui interviennent dans les situations particulières d’une partie.</p>
          </div>
          <span className={`vc-learn__special-status${specialCoursesUnlocked ? " is-unlocked" : ""}`}>
            {specialCoursesUnlocked ? <CheckCircle2 size={15} /> : <LockKeyhole size={14} />}
            {specialCoursesUnlocked ? "Débloqué" : "Progression requise"}
          </span>
        </header>
        <article className={`vc-learn__special-card${specialCoursesUnlocked ? " is-unlocked" : ""}`}>
          <span className="vc-learn__special-art" aria-hidden="true"><BookOpen size={27} /></span>
          <div className="vc-learn__special-copy">
            <span className="vc-learn__special-tag">CONTENU EN PRÉPARATION</span>
            <h3>Règles et situations spéciales</h3>
            <p>Les cours seront ajoutés au fur et à mesure de la préparation des leçons.</p>
          </div>
          <div className="vc-learn__special-unlock">
            {!user ? (
              <>
                <span>Connecte-toi pour suivre ta progression.</span>
                <button type="button" onClick={goToSignIn}>Se connecter <ArrowRight size={14} /></button>
              </>
            ) : trainingLoading || trainingLoadError ? (
              <span>{trainingLoadError ? "Progression indisponible" : "Chargement des points…"}</span>
            ) : specialCoursesUnlocked ? (
              <span className="is-unlocked"><CheckCircle2 size={15} /> Accès débloqué · cours bientôt disponibles</span>
            ) : (
              <>
                <span>{trainingProgress?.rating ?? 0} / {specialCoursesUnlockRating} points d’entraînement</span>
                <div className="vc-learn__special-progress" role="progressbar" aria-label="Progression vers les cours spéciaux" aria-valuemin={0} aria-valuemax={specialCoursesUnlockRating ?? 800} aria-valuenow={Math.min(trainingProgress?.rating ?? 0, specialCoursesUnlockRating ?? 800)}>
                  <span style={{ width: `${specialCoursesProgress}%` }} />
                </div>
              </>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
