import { useEffect, useState } from "react";
import { Award, CalendarDays, CircleUserRound, Gamepad2, Medal, Swords, Trophy, Zap } from "lucide-react";
import axiosInstance from "../axios";
import { useAuth } from "../context/AuthContext";

type PlayerStatistics = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
};

type RatingCategory = "BLITZ" | "RAPID" | "CLASSICAL";

type ModeRating = {
  category: RatingCategory;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  provisional: boolean;
};

type PlayerRatings = {
  overallRating: number;
  modes: ModeRating[];
};

const MODE_LABELS: Record<RatingCategory, string> = {
  BLITZ: "Blitz",
  RAPID: "Rapide",
  CLASSICAL: "Classique",
};

export default function ProfilePage() {
  const { profile } = useAuth();
  const [statistics, setStatistics] = useState<PlayerStatistics | null>(null);
  const [ratings, setRatings] = useState<PlayerRatings | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    void Promise.all([
      axiosInstance.get<PlayerStatistics>("/users/me/statistics"),
      axiosInstance.get<PlayerRatings>("/users/me/ratings"),
    ]).then(([statisticsResponse, ratingsResponse]) => {
      if (cancelled) return;
      setStatistics(statisticsResponse.data);
      setRatings(ratingsResponse.data);
      setError("");
    }).catch((requestError: unknown) => {
      if (cancelled) return;
      setError(requestError instanceof Error
        ? requestError.message
        : "Impossible de charger les informations du profil.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  if (!profile?.id) {
    return (
      <section className="vc-profile-guest">
        <CircleUserRound size={38} />
        <h1>Votre profil joueur</h1>
        <p>Connectez-vous pour consulter votre Elo et votre progression.</p>
        <a href="/auth">Se connecter</a>
      </section>
    );
  }

  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="vc-profile-page">
      <section className="vc-profile-hero">
        <span className="vc-profile-avatar">
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt="" />
            : profile.username.charAt(0).toUpperCase()}
        </span>
        <div className="vc-profile-identity">
          <span className="vc-home-eyebrow">PROFIL JOUEUR</span>
          <h1>{profile.username}</h1>
          {joined && <p><CalendarDays size={14} /> Membre depuis {joined}</p>}
        </div>
        <div className="vc-profile-global-rating">
          <span>Elo global</span>
          <strong>{loading ? "…" : ratings?.overallRating ?? 1500}</strong>
          <small>{ratings?.modes.some((mode) => mode.gamesPlayed > 0) ? "Moyenne des cadences" : "Classement initial"}</small>
        </div>
      </section>

      {error && <p className="vc-profile-error" role="alert">{error}</p>}

      <section className="vc-profile-overview" aria-label="Statistiques globales">
        {[
          { label: "Parties jouées", value: statistics?.gamesPlayed ?? (loading ? "…" : 0), icon: <Gamepad2 /> },
          { label: "Victoires", value: statistics?.wins ?? (loading ? "…" : 0), icon: <Trophy /> },
          { label: "Défaites", value: statistics?.losses ?? (loading ? "…" : 0), icon: <Swords /> },
          { label: "Nulles", value: statistics?.draws ?? (loading ? "…" : 0), icon: <Award /> },
        ].map((stat) => (
          <article className="vc-profile-overview__card" key={stat.label}>
            <span>{stat.icon}</span>
            <div><strong>{stat.value}</strong><small>{stat.label}</small></div>
          </article>
        ))}
      </section>

      <section className="vc-profile-ratings">
        <header>
          <div>
            <span className="vc-home-eyebrow">VOTRE PROGRESSION</span>
            <h2>Classement par cadence</h2>
          </div>
          <p><Medal size={16} /> Départ à 1500 Elo</p>
        </header>
        <div className="vc-profile-rating-grid">
          {(ratings?.modes ?? (["BLITZ", "RAPID", "CLASSICAL"] as const).map((category) => ({
            category,
            rating: 1500,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            provisional: true,
          }))).map((mode) => {
            const calibration = Math.min(100, Math.round((mode.gamesPlayed / 20) * 100));
            return (
              <article className={`vc-profile-rating-card is-${mode.category.toLowerCase()}`} key={mode.category}>
                <div className="vc-profile-rating-card__heading">
                  <span>{mode.category === "BLITZ" ? <Zap /> : mode.category === "RAPID" ? <Gamepad2 /> : <Trophy />}</span>
                  <div><strong>{MODE_LABELS[mode.category]}</strong><small>{mode.provisional ? "Classement provisoire" : "Classement confirmé"}</small></div>
                </div>
                <strong className="vc-profile-rating-card__elo">{mode.rating}<small> Elo</small></strong>
                <div className="vc-profile-rating-card__record">
                  <span>{mode.gamesPlayed} parties</span>
                  <span>{mode.wins}V · {mode.draws}N · {mode.losses}D</span>
                </div>
                <div
                  className="vc-profile-rating-progress"
                  role="progressbar"
                  aria-label={`Progression du classement ${MODE_LABELS[mode.category]}`}
                  aria-valuenow={calibration}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${calibration}%` }} />
                </div>
                <small className="vc-profile-rating-card__hint">
                  {mode.provisional ? `${Math.max(0, 20 - mode.gamesPlayed)} parties avant confirmation` : "Classement confirmé"}
                </small>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
