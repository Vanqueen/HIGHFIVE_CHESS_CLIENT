import {
  BarChart2,
  BookOpen,
  ChevronDown,
  ClipboardList,
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
  { id: "problems", label: "Problèmes", icon: <Puzzle size={18} /> },
  { id: "learn", label: "Apprendre", icon: <BookOpen size={18} /> },
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
  if (["problems", "learn", "board-editor"].includes(tab)) return "training";
  if (["profile", "rankings", "friends", "messages", "achievements"].includes(tab)) return "community";
  return "management";
};

export default function SidebarLeft({ onNavigate }: { onNavigate: () => void }) {
  const { tab, setTab } = useNavigation();
  const { profile } = useAuth();
  const [openGroup, setOpenGroup] = useState<NavGroupId | null>(() => getGroupForTab(tab));
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        : TRAINING_NAV.filter((item) => item.id === "learn"),
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
    <aside className="vc-sidebar-left fixed lg:sticky top-17.5 flex flex-wrap justify-between border-r border-solid bg-[#f7f9fa]">
      <nav className="vc-sidebar-nav" aria-label="Navigation principale">
        {groups.map((group) => {
          const expanded = openGroup === group.id;
          const groupId = `vc-sidebar-group-${group.id}`;
          return (
            <section className="vc-sidebar-nav__group" key={group.id}>
              <button
                type="button"
                className={`vc-sidebar-nav__group-trigger${expanded ? " is-expanded" : ""} px-4!`}
                aria-expanded={expanded}
                aria-controls={groupId}
                title={isCollapsed ? group.label : undefined}
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setOpenGroup(group.id);
                  } else {
                    setOpenGroup(expanded ? null : group.id);
                  }
                }}
              >
                {group.icon}
                {!isCollapsed && (
                  <>
                    <span>{group.label}</span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </>
                )}
              </button>
              <ul id={groupId} hidden={!expanded || isCollapsed}>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`vc-sidebar-nav__item${tab === item.id ? " is-active" : ""}`}
                      onClick={() => navigateTo(item.id)}
                      aria-current={tab === item.id ? "page" : undefined}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {item.icon}
                      {!isCollapsed && <span>{item.label}</span>}
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
          <div className="vc-sidebar-quote min-h-75 relative flex flex-col items-start justify-end overflow-hidden mt-2.5 px-6 py-4 rounded-xl text-[#344e68]">
            <div className="vc-sidebar-quote__icon">♞</div>
            <p>Chaque partie est une nouvelle opportunité d'apprendre et de progresser.</p>
            <span>— CHESSARENA</span>
          </div>
        ) : (
          <section className="vc-guest-signup min-h-60 relative flex flex-col justify-between items-start gap-2 mt-auto p-4 overflow-hidden border border-solid border-[#ece8e1] rounded-xl">
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
