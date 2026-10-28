import {
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Crosshair,
  FileText,
  Gamepad2,
  Home,
  LayoutGrid,
  Medal,
  MessageSquare,
  Puzzle,
  Shield,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigation, type Tab } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";

type NavItem = { id: Tab; label: string; icon: React.ReactNode };
type NavGroupId = "play" | "training" | "community" | "management";
type NavGroup = { id: NavGroupId; label: string; icon: React.ReactNode; items: NavItem[] };

const PLAY_NAV: NavItem[] = [
  { id: "home", label: "Accueil", icon: <Home size={18} /> },
  { id: "play", label: "Jouer", icon: <Gamepad2 size={18} /> },
  { id: "tournaments", label: "Tournois", icon: <Trophy size={18} /> },
];

const TRAINING_NAV: NavItem[] = [
  { id: "learn", label: "Apprendre", icon: <BookOpen size={18} /> },
  { id: "rules", label: "Règles", icon: <FileText size={18} /> },
  { id: "strategy", label: "Thèmes techniques & lecture de l’échiquier", icon: <Crosshair size={18} /> },
  { id: "problems", label: "Problèmes", icon: <Puzzle size={18} /> },
  { id: "board-editor", label: "Éditeur d'échiquier", icon: <LayoutGrid size={18} /> },
];

const COMMUNITY_NAV: NavItem[] = [
  { id: "profile", label: "Mon profil", icon: <UserRound size={18} /> },
  { id: "rankings", label: "Classements", icon: <BarChart2 size={18} /> },
  { id: "friends", label: "Amis", icon: <Users size={18} /> },
  { id: "messages", label: "Messages", icon: <MessageSquare size={18} /> },
  { id: "achievements", label: "Mes succès", icon: <Medal size={18} /> },
];

const getGroupForTab = (tab: Tab): NavGroupId => {
  if (["home", "play", "tournaments"].includes(tab)) return "play";
  if (["rules", "problems", "learn", "strategy", "board-editor"].includes(tab)) return "training";
  if (["profile", "rankings", "friends", "messages", "achievements"].includes(tab)) return "community";
  return "management";
};

type SidebarLeftProps = {
  onNavigate: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
};

export default function SidebarLeft({ onNavigate, onToggleSidebar, sidebarCollapsed }: SidebarLeftProps) {
  const { tab, setTab } = useNavigation();
  const { profile } = useAuth();
  const [openGroup, setOpenGroup] = useState<NavGroupId | null>(() => getGroupForTab(tab));
  const isAuthenticated = Boolean(profile?.id);
  const role = profile?.role;
  const roleLabel = role === "ADMIN"
    ? "Administrateur"
    : role === "ORGANIZER"
      ? "Organisateur"
      : "Joueur";

  useEffect(() => {
    setOpenGroup(getGroupForTab(tab));
  }, [tab]);

  const groups: NavGroup[] = [
    {
      id: "play",
      label: "Jouer",
      icon: <Gamepad2 size={18} />,
      items: isAuthenticated
        ? PLAY_NAV
        : PLAY_NAV.filter((item) => item.id === "home" || item.id === "play"),
    },
    {
      id: "training",
      label: "Entraînement",
      icon: <BookOpen size={18} />,
      items: isAuthenticated
        ? TRAINING_NAV
        : TRAINING_NAV.filter((item) => item.id === "learn" || item.id === "rules" || item.id === "strategy"),
    },
    ...(isAuthenticated
      ? [{
          id: "community" as const,
          label: "Communauté",
          icon: <Users size={18} />,
          items: COMMUNITY_NAV,
        }]
      : []),
    ...(isAuthenticated && (role === "ADMIN" || role === "ORGANIZER")
      ? [{
          id: "management" as const,
          label: roleLabel,
          icon: role === "ADMIN" ? <Shield size={18} /> : <ClipboardList size={18} />,
          items: [
            ...(role === "ADMIN"
              ? [{ id: "admin" as const, label: "Administration", icon: <Shield size={18} /> }]
              : []),
            { id: "organizer" as const, label: "Espace organisateur", icon: <ClipboardList size={18} /> },
          ],
        }]
      : []),
  ];

  const navigateTo = (nextTab: Tab) => {
    setTab(nextTab);
    onNavigate();
  };

  return (
    <aside className="vc-sidebar-left" id="vc-sidebar-left">
      <button
        type="button"
        className="vc-sidebar-collapse-btn"
        aria-label="Basculer l’affichage de la barre latérale"
        aria-controls="vc-sidebar-left"
        onClick={onToggleSidebar}
      >
        {sidebarCollapsed ? <ChevronRight size={18} aria-hidden="true" /> : <ChevronLeft size={18} aria-hidden="true" />}
      </button>
      <nav className="vc-sidebar-nav" aria-label="Navigation principale">
        {groups.map((group) => {
          const expanded = openGroup === group.id;
          const groupId = `vc-sidebar-group-${group.id}`;
          return (
            <section className="vc-sidebar-nav__group" key={group.id}>
              <button
                type="button"
                className={`vc-sidebar-nav__group-trigger${expanded ? " is-expanded" : ""}`}
                aria-expanded={expanded}
                aria-controls={groupId}
                onClick={() => setOpenGroup(expanded ? null : group.id)}
              >
                {group.icon}
                <span>{group.label}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <ul id={groupId} hidden={!expanded}>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`vc-sidebar-nav__item${tab === item.id ? " is-active" : ""}${item.id === "strategy" ? " vc-sidebar-nav__item--strategy" : ""} mt-1`}
                      onClick={() => navigateTo(item.id)}
                      aria-current={tab === item.id ? "page" : undefined}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </nav>
      <div className="flex justify-end w-full">
        {isAuthenticated ? (
          <div className="vc-sidebar-quote min-h-65 relative flex flex-col items-start justify-end overflow-hidden mt-2.5 px-6 py-4 rounded-xl text-[#344e68]">
            <div className="vc-sidebar-quote__icon">♞</div>
            <p>Chaque partie est une nouvelle opportunité d'apprendre et de progresser.</p>
            <span>— CHESSARENA</span>
          </div>
        ) : (
          <section className="vc-guest-signup min-h-50 relative flex flex-col justify-between items-start gap-2 mt-auto p-4 overflow-hidden border border-solid border-[#ece8e1] rounded-xl">
            <span className="vc-guest-signup__piece justify-self-center text-[#65756b] text-5xl" aria-hidden="true">♞</span>
            <div className="flex flex-col gap-y-4">
              <div>
                <strong className="text-xs">Bienvenue sur CHESSARENA !</strong>
                <p>Même sans compte, tu peux jouer, apprendre et t’amuser.</p>
              </div>
              <a href="/auth">Créer un compte</a>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
