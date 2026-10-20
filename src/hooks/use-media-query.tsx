import * as React from "react";

/**
 * Hook personnalisé qui permet de réagir aux media queries CSS
 * @param query - La media query CSS à surveiller (ex: "(min-width: 768px)")
 * @returns boolean - True si la media query correspond aux conditions actuelles, false sinon
 */
export function useMediaQuery(query: string) {
  const subscribe = React.useCallback((onChange: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [query]);
  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
