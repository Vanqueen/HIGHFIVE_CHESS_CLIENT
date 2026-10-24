import { useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import HeaderPage from "./Header";
import SidebarLeft from "./SidebarLeft";
import SidebarRight from "./SidebarRight";
import HomePage from "./HomePage";
import PlayPage from "./PlayPage";
import ComputerGamePage from "./ComputerGamePage";
import GamesPage from "./GamesPage";
import TournamentsPage from "./TournamentsPage";
import UsersPage from "./UsersPage";
import MessagesPage from "./MessagesPage";
import NotificationsPage from "./NotificationsPage";
import LearnPage from "./LearnPage";
import WatchPage from "./WatchPage";
import ProblemsPage from "./ProblemsPage";
import RankingsPage from "./RankingsPage";
import BoardEditorPage from "./BoardEditorPage";
import AchievementsPage from "./AchievementsPage";
import OrganizerDashboardPage from "./OrganizerDashboardPage";
import AdminDashboardPage from "./AdminDashboardPage";
import ProfilePage from "./ProfilePage";
import { useAuth } from "../context/AuthContext";

export default function MainApp() {
  const { tab, setTab, notifications } = useNavigation();
  const { profile } = useAuth();
  const [messageFriend, setMessageFriend] = useState<{ id: number; username: string } | null>(null);
  const [quickGameSettings, setQuickGameSettings] = useState({
    initialTimeSeconds: 600,
    incrementSeconds: 0,
  });
  const [autoStartGame, setAutoStartGame] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const closeSidebarOnMobile = () => {
    if (window.matchMedia("(max-width: 1100px)").matches) {
      setSidebarCollapsed(false);
    }
  };
  return (
    <div className={`vc-app${sidebarCollapsed ? " vc-app--sidebar-collapsed" : ""}`}>
      <HeaderPage onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)} />
      {sidebarCollapsed && (
        <button
          type="button"
          className="vc-sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setSidebarCollapsed(false)}
        />
      )}
      <div className="vc-layout">
        <SidebarLeft onNavigate={closeSidebarOnMobile} />

        <main className="vc-main">
          {tab === "home" && (
            <HomePage
              onStartGame={(initialTimeSeconds, incrementSeconds) => {
                setQuickGameSettings({ initialTimeSeconds, incrementSeconds });
                setAutoStartGame(true);
                setTab("play");
              }}
            />
          )}
          {tab === "profile" && <ProfilePage />}
          {tab === "play" && (
            <PlayPage
              onNavigate={(t) => setTab(t as typeof tab)}
              initialTimeSeconds={quickGameSettings.initialTimeSeconds}
              incrementSeconds={quickGameSettings.incrementSeconds}
              autoStartGame={autoStartGame}
              onAutoStartHandled={() => setAutoStartGame(false)}
            />
          )}
          {tab === "computer" && <ComputerGamePage onExit={() => setTab("home")} />}
          {tab === "games" && <GamesPage onNavigate={(t) => setTab(t as typeof tab)} />}
          {tab === "tournaments" && <TournamentsPage />}
          {tab === "users" && (
            <UsersPage onOpenMessages={(friend) => {
              setMessageFriend(friend);
              setTab("messages");
            }} />
          )}
          {tab === "friends" && (
            <UsersPage onOpenMessages={(friend) => {
              setMessageFriend(friend);
              setTab("messages");
            }} />
          )}
          {tab === "messages" && (
            <MessagesPage
              initialFriend={messageFriend}
              onInitialFriendHandled={() => setMessageFriend(null)}
            />
          )}
          {tab === "notifications" && <NotificationsPage notifications={notifications} />}
          {tab === "learn" && <LearnPage />}
          {tab === "watch" && <WatchPage />}
          {tab === "problems" && <ProblemsPage />}
          {tab === "rankings" && <RankingsPage />}
          {tab === "board-editor" && <BoardEditorPage />}
          {tab === "achievements" && profile && <AchievementsPage />}
          {tab === "organizer" && (profile?.role === "ORGANIZER" || profile?.role === "ADMIN") && (
            <OrganizerDashboardPage onOpenTournaments={() => setTab("tournaments")} />
          )}
          {tab === "admin" && profile?.role === "ADMIN" && <AdminDashboardPage />}
        </main>

        {tab === "home" && <SidebarRight />}
      </div>
    </div>
  );
}
