import { useEffect, useRef, useState } from 'react';

/**
 * Detecta la dirección del scroll (estilo navbar de anthropic.com).
 * Cerca del tope (< minY) siempre devuelve 'up' para no colapsar el header inicial.
 */
export function useScrollDirection(minY = 80, delta = 6): 'up' | 'down' {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < minY) {
        setDirection('up');
      } else if (Math.abs(y - lastY.current) > delta) {
        setDirection(y > lastY.current ? 'down' : 'up');
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [minY, delta]);

  return direction;
}
