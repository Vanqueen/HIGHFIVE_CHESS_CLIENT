import { Search, Bell, Home, Gamepad2, BookOpen, Eye, Users, UserRound } from "lucide-react";
import PlayerProfileMenu from "../components/PlayerProfileMenu";
import { useNavigation, type Tab } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";

type TopNavItem = { id: Tab; label: string };

const TOP_NAV: Array<TopNavItem & { icon: React.ReactNode }> = [
  { id: "home", label: "Accueil", icon: <Home size={17} /> },
  { id: "play", label: "Jouer", icon: <Gamepad2 size={17} /> },
  { id: "learn", label: "Apprendre", icon: <BookOpen size={17} /> },
  { id: "watch", label: "Regarder", icon: <Eye size={17} /> },
  { id: "friends", label: "Communauté", icon: <Users size={17} /> },
];

export default function HeaderPage() {
  const { tab, setTab, notifications, markAllRead } = useNavigation();
  const { profile } = useAuth();
  const isAuthenticated = Boolean(profile?.id);
  const visibleTopNav = isAuthenticated
    ? TOP_NAV
    : TOP_NAV.filter((item) => ["home", "play", "learn"].includes(item.id));
  const unreadCount = notifications.filter((n) => !n.read_status).length;

  return (
    <header className="vc-header">
      <div className="vc-header__inner">
        {/* Logo */}
        <button className="vc-logo" onClick={() => setTab("home")} aria-label="VACHESS, accueil">
          <span className="vc-logo__icon">♞</span>
          <span className="vc-logo__text">VACHESS</span>
        </button>

        {/* Nav principale */}
        <nav className="vc-top-nav" aria-label="Navigation principale">
          {visibleTopNav.map((item) => (
            <button
              key={item.id}
              className={`vc-top-nav__item${tab === item.id ? " is-active" : ""}`}
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions droite */}
        <div className="vc-header__actions">
          {isAuthenticated ? (
            <>
              <button className="vc-header__icon-btn" aria-label="Rechercher">
                <Search size={18} />
              </button>
              <button
                className="vc-header__icon-btn vc-header__notif-btn"
                aria-label="Notifications"
                onClick={() => { setTab("notifications"); markAllRead(); }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="vc-header__notif-badge">{unreadCount}</span>
                )}
              </button>
              <PlayerProfileMenu />
            </>
          ) : (
            <a className="vc-guest-header-account" href="/auth">
              <UserRound size={17} aria-hidden="true" />
              <span><strong>Invité</strong><small>Connexion / inscription</small></span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
