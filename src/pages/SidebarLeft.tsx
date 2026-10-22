import {
  Home,
  Gamepad2,
  Trophy,
  Puzzle,
  BookOpen,
  LayoutGrid,
  BarChart2,
  Users,
  MessageSquare,
  Medal,
  Shield,
  ClipboardList,
} from "lucide-react";
import { useNavigation, type Tab } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";

type NavItem = { id: Tab; label: string; icon: React.ReactNode };

const MAIN_NAV: NavItem[] = [
  { id: "home", label: "Accueil", icon: <Home size={18} /> },
  { id: "play", label: "Jouer", icon: <Gamepad2 size={18} /> },
  { id: "tournaments", label: "Tournois", icon: <Trophy size={18} /> },
  { id: "problems", label: "Problèmes", icon: <Puzzle size={18} /> },
  { id: "learn", label: "Apprendre", icon: <BookOpen size={18} /> },
  { id: "board-editor", label: "Éditeur d'échiquier", icon: <LayoutGrid size={18} /> },
];

const COMMUNITY_NAV: NavItem[] = [
  { id: "rankings", label: "Classements", icon: <BarChart2 size={18} /> },
  { id: "friends", label: "Amis", icon: <Users size={18} /> },
  { id: "messages", label: "Messages", icon: <MessageSquare size={18} /> },
  { id: "achievements", label: "Mes succès", icon: <Medal size={18} /> },
];

export default function SidebarLeft() {
  const { tab, setTab } = useNavigation();
  const { profile } = useAuth();
  const isAuthenticated = Boolean(profile?.id);
  const role = profile?.role;
  const roleLabel = role === "ADMIN"
    ? "Administrateur"
    : role === "ORGANIZER"
      ? "Organisateur"
      : "Joueur";
  const visibleMainNav = isAuthenticated
    ? MAIN_NAV
    : MAIN_NAV.filter((item) => ["home", "play", "learn"].includes(item.id));

  return (
    <aside className="vc-sidebar-left">
      <nav className="vc-sidebar-nav">
        <ul>
          {visibleMainNav.map((item) => (
            <li key={item.id}>
              <button
                className={`vc-sidebar-nav__item${tab === item.id ? " is-active" : ""}`}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? "page" : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {isAuthenticated && (
          <>
            <p className="vc-sidebar-nav__section-label">COMMUNAUTÉ</p>
            <ul>
              {COMMUNITY_NAV.map((item) => (
                <li key={item.id}>
                  <button
                    className={`vc-sidebar-nav__item${tab === item.id ? " is-active" : ""}`}
                    onClick={() => setTab(item.id)}
                    aria-current={tab === item.id ? "page" : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {isAuthenticated && (role === "ADMIN" || role === "ORGANIZER") && (
          <>
            <p className="vc-sidebar-nav__section-label">{roleLabel.toLocaleUpperCase("fr-FR")}</p>
            <ul>
              {role === "ADMIN" && (
                <li>
                  <button
                    className={`vc-sidebar-nav__item${tab === "admin" ? " is-active" : ""}`}
                    onClick={() => setTab("admin")}
                    aria-current={tab === "admin" ? "page" : undefined}
                  >
                    <Shield size={18} />
                    <span>Administration</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  className={`vc-sidebar-nav__item${tab === "organizer" ? " is-active" : ""}`}
                  onClick={() => setTab("organizer")}
                  aria-current={tab === "organizer" ? "page" : undefined}
                >
                  <ClipboardList size={18} />
                  <span>Espace organisateur</span>
                </button>
              </li>
            </ul>
          </>
        )}
      </nav>

      {isAuthenticated ? (
        <div className="vc-sidebar-quote">
        <div className="vc-sidebar-quote__icon">♞</div>
        <p>Chaque partie est une nouvelle opportunité d'apprendre et de progresser.</p>
        <span>— CHESSARENA</span>
        </div>
      ) : (
        <section className="vc-guest-signup">
          <span className="vc-guest-signup__piece" aria-hidden="true">♞</span>
          <strong>Bienvenue sur CHESSARENA !</strong>
          <p>Même sans compte, tu peux jouer, apprendre et t’amuser.</p>
          <a href="/auth">Créer un compte</a>
        </section>
      )}
    </aside>
  );
}
