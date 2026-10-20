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

// Pages qui utilisent le layout pleine largeur (sans sidebars)
const FULL_WIDTH_TABS = new Set(["play", "computer", "games"]);

export default function MainApp() {
  const { tab, setTab, notifications } = useNavigation();
  const [quickGameSettings, setQuickGameSettings] = useState({
    initialTimeSeconds: 600,
    incrementSeconds: 0,
  });
  const [autoStartGame, setAutoStartGame] = useState(false);
  const isFullWidth = FULL_WIDTH_TABS.has(tab);

  return (
    <div className="vc-app">
      <HeaderPage />
      <div className={`vc-layout${isFullWidth ? " vc-layout--full" : ""}`}>
        {!isFullWidth && <SidebarLeft />}

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
          {tab === "play" && (
            <PlayPage
              onNavigate={(t) => setTab(t as typeof tab)}
              initialTimeSeconds={quickGameSettings.initialTimeSeconds}
              incrementSeconds={quickGameSettings.incrementSeconds}
              autoStartGame={autoStartGame}
              onAutoStartHandled={() => setAutoStartGame(false)}
            />
          )}
          {tab === "computer" && <ComputerGamePage onExit={() => setTab("play")} />}
          {tab === "games" && <GamesPage onNavigate={(t) => setTab(t as typeof tab)} />}
          {tab === "tournaments" && <TournamentsPage />}
          {tab === "users" && <UsersPage onOpenMessages={() => setTab("messages")} />}
          {tab === "friends" && <UsersPage onOpenMessages={() => setTab("messages")} />}
          {tab === "messages" && <MessagesPage />}
          {tab === "notifications" && <NotificationsPage notifications={notifications} />}
          {tab === "learn" && <LearnPage />}
          {tab === "watch" && <WatchPage />}
          {tab === "problems" && <ProblemsPage />}
          {tab === "rankings" && <RankingsPage />}
          {tab === "board-editor" && <BoardEditorPage />}
        </main>

        {!isFullWidth && tab === "home" && <SidebarRight />}
      </div>
    </div>
  );
}
