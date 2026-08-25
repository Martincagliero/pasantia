import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function useTouchDevice(): boolean {
  const coarsePointer = useMediaQuery('(pointer: coarse)');
  const [hasTouch] = useState(
    () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
  );

  return coarsePointer || hasTouch;
}