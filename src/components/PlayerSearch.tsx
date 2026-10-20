import { useEffect, useState } from "react";
import { LoaderCircle, Search, UserRound } from "lucide-react";
import type { AxiosError } from "axios";
import axiosInstance from "../axios";

export type PlayerSummary = {
  id: number;
  username: string;
  avatarUrl: string | null;
};

type PlayerSearchProps = {
  onSelect: (player: PlayerSummary | null) => void;
  placeholder?: string;
  selectedPlayer?: PlayerSummary | null;
  excludeUserId?: number | null;
};

function searchError(error: unknown) {
  const response = (error as AxiosError<{ message?: string }>).response?.data;
  return response?.message ?? (error instanceof Error ? error.message : "La recherche a échoué.");
}

export default function PlayerSearch({
  onSelect,
  placeholder = "Rechercher par pseudonyme",
  selectedPlayer = null,
  excludeUserId = null,
}: PlayerSearchProps) {
  const [query, setQuery] = useState(selectedPlayer?.username ?? "");
  const [results, setResults] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const username = query.trim();
    if (selectedPlayer || username.length < 2) return;

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void axiosInstance
        .get<PlayerSummary[]>("/users/search", { params: { username } })
        .then(({ data }) => {
          if (!cancelled) {
            setResults(data.filter((player) => player.id !== excludeUserId));
          }
        })
        .catch((requestError: unknown) => {
          if (!cancelled) setError(searchError(requestError));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query, selectedPlayer, excludeUserId]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setResults([]);
    setError("");
    setLoading(value.trim().length >= 2);
    onSelect(null);
  };

  return (
    <div className="relative">
      <label className="sr-only">Rechercher un joueur par pseudonyme</label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3">
        {loading
          ? <LoaderCircle className="h-4 w-4 animate-spin text-slate-500" aria-hidden="true" />
          : <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />}
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-rose-300">{error}</p>}
      {!selectedPlayer && query.trim().length >= 2 && !loading && !error && results.length === 0 && (
        <p className="mt-1 text-xs text-slate-500">Aucun joueur trouvé.</p>
      )}
      {!selectedPlayer && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl">
          {results.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                onClick={() => {
                  setQuery(player.username);
                  setResults([]);
                  setError("");
                  onSelect(player);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                <UserRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>{player.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedPlayer && (
        <button
          type="button"
          onClick={() => updateQuery("")}
          className="mt-1 text-xs text-amber-300 hover:text-amber-200"
        >
          Effacer la sélection
        </button>
      )}
    </div>
  );
}
