import { Search, Bell, Users, UserRound, Moon, Sun, Menu, Swords } from "lucide-react";
import { useState } from "react";
import PlayerProfileMenu from "../components/PlayerProfileMenu";
import { useNavigation } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";
import { applyTheme, getInitialTheme, type ThemeMode } from "../assets/js/theme";

export default function HeaderPage({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { setTab, notifications, markAllRead } = useNavigation();
  const { profile } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const isAuthenticated = Boolean(profile?.id);
  const unreadCount = notifications.filter((n) => !n.read_status).length;
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <header className="vc-header">
      <div className="vc-header__inner">
        <button
          type="button"
          className="vc-header__menu-btn"
          aria-label="Afficher ou masquer la navigation"
          onClick={onToggleSidebar}
        >
          <Menu size={23} />
        </button>
        {/* Logo */}
        <button className="vc-sidebar-brand" onClick={() => setTab("home")} aria-label="CHESSARENA, accueil">
          <span aria-hidden="true">♞</span>
        <strong className="flex flex-col">CHESS<span>ARENA</span></strong>
        </button>

        {/* Actions droite */}
        <div className="vc-header__actions">
          <button
            type="button"
            className="vc-header__icon-btn vc-theme-toggle"
            aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
            title={theme === "dark" ? "Thème clair" : "Thème sombre"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <>
              <button className="vc-header__icon-btn" aria-label="Rechercher des joueurs" onClick={() => setTab("users")}>
                <Search size={18} />
              </button>
              <button className="vc-header__icon-btn" aria-label="Communauté" onClick={() => setTab("friends")}>
                <Users size={18} />
              </button>
              <button className="vc-header__icon-btn" aria-label="Jouer" onClick={() => setTab("play")}>
                <Swords size={18} />
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
