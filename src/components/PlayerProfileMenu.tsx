import { useEffect, useRef, useState } from "react";
import { Award, Check, ChevronDown, Gamepad2, LogOut, Swords, X } from "lucide-react";
import axiosInstance from "../axios";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "../context/NavigationContext";

type PlayerStatistics = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
};

function formatMemberSince(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}

export default function PlayerProfileMenu() {
  const { profile, logout } = useAuth();
  const { setTab } = useNavigation();
  const [open, setOpen] = useState(false);
  const [statistics, setStatistics] = useState<PlayerStatistics | null>(null);
  const [statisticsError, setStatisticsError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || statistics) return;
    let cancelled = false;
    void axiosInstance.get<PlayerStatistics>("/users/me/statistics")
      .then(({ data }) => {
        if (!cancelled) {
          setStatistics(data);
          setStatisticsError("");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatisticsError(
            error instanceof Error ? error.message : "Impossible de charger vos statistiques.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, statistics]);

  const openTab = (tab: "play" | "games") => {
    setTab(tab);
    setOpen(false);
  };

  const memberSince = formatMemberSince(profile?.createdAt);
  const roleLabel = profile?.role === "ADMIN"
    ? "Administrateur"
    : profile?.role === "ORGANIZER"
      ? "Organisateur"
      : "Joueur";

  return (
    <div className="player-profile-menu" ref={menuRef}>
      <button
        type="button"
        className="vc-header__user"
        aria-label="Ouvrir le profil du joueur"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="vc-header__avatar">
          {profile?.avatarUrl
            ? <img src={profile.avatarUrl} alt="" />
            : profile?.username?.charAt(0).toUpperCase() ?? "J"}
        </span>
        <span className="vc-header__username">{profile?.username ?? "Joueur"}</span>
        <ChevronDown
          size={16}
          className={`player-profile-menu__chevron${open ? " is-open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <section className="player-profile-menu__panel" role="dialog" aria-label="Profil du joueur">
          <div className="player-profile-menu__identity">
            <span className="player-profile-menu__avatar">
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt="" />
                : profile?.username?.charAt(0).toUpperCase() ?? "J"}
            </span>
            <div className="player-profile-menu__identity-copy">
              <strong>{profile?.username ?? "Joueur"}</strong>
              {profile?.email && <span>{profile.email}</span>}
              <span className="player-profile-menu__role">{roleLabel}</span>
              <small>
                <i />
                En ligne
                {profile?.isVerified && <span className="player-profile-menu__verified"><Check size={12} /> Compte vérifié</span>}
              </small>
            </div>
            <button
              type="button"
              className="player-profile-menu__close"
              aria-label="Fermer le profil"
              onClick={() => setOpen(false)}
            >
              <X size={17} />
            </button>
          </div>

          {memberSince && (
            <p className="player-profile-menu__member">Membre depuis {memberSince}</p>
          )}

          <div className="player-profile-menu__stats" aria-label="Statistiques du joueur">
            {statistics ? (
              <>
                <div><strong>{statistics.gamesPlayed}</strong><span>Parties</span></div>
                <div><strong>{statistics.wins}</strong><span>Victoires</span></div>
                <div><strong>{statistics.draws}</strong><span>Nulles</span></div>
              </>
            ) : statisticsError ? (
              <p className="player-profile-menu__stats-error">{statisticsError}</p>
            ) : (
              <p className="player-profile-menu__loading">Chargement des statistiques…</p>
            )}
          </div>

          <div className="player-profile-menu__actions">
            <button type="button" onClick={() => openTab("games")}>
              <Gamepad2 size={17} /> Mes parties
            </button>
            <button type="button" onClick={() => openTab("play")}>
              <Swords size={17} /> Lancer une partie
            </button>
            <button type="button" onClick={() => { setTab("achievements"); setOpen(false); }}>
              <Award size={17} /> Mes succès
            </button>
          </div>
          <button
            type="button"
            className="player-profile-menu__logout"
            onClick={() => void logout()}
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </section>
      )}
    </div>
  );
}
