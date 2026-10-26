import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Gamepad2, Swords, Trophy } from "lucide-react";
import axiosInstance from "../axios";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "../context/NavigationContext";

type PlayerStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
};

type PlayerRatings = {
  overallRating: number;
};

export default function SidebarRight() {
  const { profile } = useAuth();
  const { setTab, notifications } = useNavigation();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [statsError, setStatsError] = useState("");
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [ratingsError, setRatingsError] = useState("");

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    void axiosInstance.get<PlayerStats>("/users/me/statistics")
      .then(({ data }) => {
        if (cancelled) return;
        setStats(data);
        setStatsError("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatsError(error instanceof Error ? error.message : "Impossible de charger vos statistiques.");
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    void axiosInstance.get<PlayerRatings>("/users/me/ratings")
      .then(({ data }) => {
        if (cancelled) return;
        setOverallRating(data.overallRating);
        setRatingsError("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setRatingsError(error instanceof Error ? error.message : "Impossible de charger votre Elo.");
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  if (!profile?.id) {
    return null;
  }

  return (
    <aside className="vc-sidebar-right">
      <section className="vc-player-panel">
        <div className="vc-profile-card">
          <div className="vc-profile-card__top">
            <span className="vc-profile-card__avatar">
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt="" />
                : profile?.username?.charAt(0).toUpperCase() ?? "J"}
            </span>
            <div>
              <p className="vc-profile-card__greeting">Bon retour,</p>
              <p className="vc-profile-card__name">
                {profile?.username ?? "Joueur"} <span className="vc-profile-card__crown">♛</span>
              </p>
              <p className="vc-profile-card__status">
                <span className="vc-online-dot" /> Prêt à jouer
              </p>
            </div>
          </div>
          <div className="vc-profile-card__stats">
            <div className="vc-profile-stat">
              <span>Parties jouées</span>
              <strong>{stats?.gamesPlayed ?? (statsError ? "—" : "…")}</strong>
            </div>
            <div className="vc-profile-stat">
              <span>Taux de victoire</span>
              <strong>
                {stats
                  ? `${stats.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}%`
                  : statsError ? "—" : "…"}
              </strong>
            </div>
            <div className="vc-profile-stat">
              <span>Elo global</span>
              <strong>{overallRating ?? (ratingsError ? "—" : "…")}</strong>
            </div>
            {statsError && <small role="status" className="vc-profile-stat__error">{statsError}</small>}
            {ratingsError && <small role="status" className="vc-profile-stat__error">{ratingsError}</small>}
          </div>
        </div>

        <div className="vc-quick-actions" aria-label="Raccourcis">
          <button className="vc-quick-action vc-quick-action--green" onClick={() => setTab("play")}>
            <span className="vc-quick-action__icon"><Swords size={18} /></span>
            <span className="vc-quick-action__copy">
              <strong>Créer un défi</strong>
              <small>Jouez avec un ami ou un invité</small>
            </span>
            <ArrowRight size={16} className="vc-quick-action__arrow" />
          </button>
          <button className="vc-quick-action vc-quick-action--blue" onClick={() => setTab("games")}>
            <span className="vc-quick-action__icon"><Gamepad2 size={18} /></span>
            <span className="vc-quick-action__copy">
              <strong>Mes parties</strong>
              <small>Reprenez ou revoyez une partie</small>
            </span>
            <ArrowRight size={16} className="vc-quick-action__arrow" />
          </button>
          <button className="vc-quick-action vc-quick-action--gray" onClick={() => setTab("tournaments")}>
            <span className="vc-quick-action__icon"><Trophy size={18} /></span>
            <span className="vc-quick-action__copy">
              <strong>Tournois</strong>
              <small>Jouez avec la communauté</small>
            </span>
            <ArrowRight size={16} className="vc-quick-action__arrow" />
          </button>
        </div>

        <section className="vc-recent vc-activity-panel">
          <h2>Activité récente</h2>
          {notifications.length ? (
            <ul>
              {notifications.slice(0, 3).map((notification) => (
                <li key={notification.id}>
                  <span><Zap size={15} /></span>
                  <p>
                    <strong>{notification.title}</strong>
                    <small>{notification.message ?? "Nouvelle activité sur votre compte."}</small>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vc-activity-empty">Vos notifications de parties et de tournois apparaîtront ici.</p>
          )}
        </section>

        <button type="button" className="vc-sidebar-learn" onClick={() => setTab("learn")}>
          <span className="vc-sidebar-learn__copy">
            <strong>Apprendre les échecs</strong>
            <small>Des leçons simples pour progresser à votre rythme.</small>
            <span>Accéder <ArrowRight size={13} /></span>
          </span>
          <BookOpen size={25} aria-hidden="true" />
        </button>
      </section>
    </aside>
  );
}
