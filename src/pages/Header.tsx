import { Search, Bell, Users, UserRound, Moon, Sun, Menu, Swords, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PlayerProfileMenu from "../components/PlayerProfileMenu";
import { useNavigation } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";
import { applyTheme, getInitialTheme, type ThemeMode } from "../assets/js/theme";

export default function HeaderPage({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { setTab, notifications, markAllRead } = useNavigation();
  const { profile } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const isAuthenticated = Boolean(profile?.id);
  const unreadCount = notifications.filter((n) => !n.read_status).length;
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !moreMenuRef.current?.contains(event.target)) {
        setMoreOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  const navigateFromMoreMenu = (nextTab: "users" | "friends" | "play" | "notifications") => {
    setTab(nextTab);
    if (nextTab === "notifications") markAllRead();
    setMoreOpen(false);
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
        <div className={`vc-header__actions${isAuthenticated ? " vc-header__actions--authenticated" : ""}`}>
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
              <div className="vc-header__more" ref={moreMenuRef}>
                <button
                  type="button"
                  className="vc-header__icon-btn vc-header__more-btn"
                  aria-label="Plus d’actions"
                  aria-expanded={moreOpen}
                  aria-controls="vc-header-more-menu"
                  ref={moreButtonRef}
                  onClick={() => setMoreOpen((open) => !open)}
                >
                  <MoreHorizontal size={21} />
                </button>
                {moreOpen && (
                  <div className="vc-header__more-menu" id="vc-header-more-menu" role="group" aria-label="Actions rapides">
                    <button type="button" onClick={() => navigateFromMoreMenu("users")}>
                      <Search size={17} />
                      <span>Rechercher des joueurs</span>
                    </button>
                    <button type="button" onClick={() => navigateFromMoreMenu("friends")}>
                      <Users size={17} />
                      <span>Communauté</span>
                    </button>
                    <button type="button" onClick={() => navigateFromMoreMenu("play")}>
                      <Swords size={17} />
                      <span>Lancer une partie</span>
                    </button>
                    <button type="button" onClick={() => navigateFromMoreMenu("notifications")}>
                      <Bell size={17} />
                      <span>Notifications</span>
                      {unreadCount > 0 && <span className="vc-header__more-badge">{unreadCount}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setMoreOpen(false);
                      }}
                    >
                      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                      <span>{theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}</span>
                    </button>
                  </div>
                )}
              </div>
              <PlayerProfileMenu />
            </>
          ) : (
            <a className="h-11 inline-flex items-center gap-2 p-2 border border-solid border-[#e9e6e0] dark:border-[#2b4036] rounded-lg text-[#344246] dark:text-[#e1ebe4] bg-white dark:bg-[#14251e] no-underline" href="/auth">
              <div className="flex flex-col items-center justify-between">
                <span className="flex w-full gap-0.5 items-center">
                  <UserRound size={12} aria-hidden="true" /><strong className="text-[12px]">Invité</strong>
                </span>
                <small className="text-[9px] text-[#829094] dark:text-[#a0b1a8] ">Connexion </small>
                <small className="text-[9px] text-[#829094] dark:text-[#a0b1a8] ">Inscription</small>
              </div>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
