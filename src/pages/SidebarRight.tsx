import { ArrowRight, Gamepad2, Swords, Trophy, Zap, ShieldCheck, ChartNoAxesColumn, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "../context/NavigationContext";

export default function SidebarRight() {
  const { profile } = useAuth();
  const { setTab } = useNavigation();

  if (!profile?.id) {
    return (
      <aside className="vc-sidebar-right">
        <section className="vc-guest-benefits">
          <h2>Pourquoi jouer sur HIGHFIVE CHESSARENA ?</h2>
          <ul>
            <li><span><Zap size={17} /></span><p>Des parties rapides<br />et fluides</p></li>
            <li><span><ShieldCheck size={17} /></span><p>Une expérience<br />bienveillante</p></li>
            <li><span><ChartNoAxesColumn size={17} /></span><p>Un suivi de ta<br />progression</p></li>
            <li><span><Star size={17} /></span><p>Une expérience simple<br />et agréable</p></li>
          </ul>
          <blockquote>
            <strong>“</strong>
            <p>Chaque partie est une nouvelle occasion d’apprendre.</p>
            <small>— HIGHFIVE CHESSARENA</small>
          </blockquote>
        </section>
      </aside>
    );
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
              <span>Un nouveau défi vous attend</span>
              <strong>À vous de jouer</strong>
            </div>
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
      </section>
    </aside>
  );
}
