import type { ReactNode } from 'react';

interface MarqueeProps {
  items: ReactNode[];
  /** Segundos que tarda un ciclo completo. */
  speed?: number;
  className?: string;
}

/**
 * Marquee horizontal infinito. Duplica los items para el loop sin cortes
 * y se pausa al hacer hover. Respeta prefers-reduced-motion (vía CSS global).
 */
export function Marquee({ items, speed = 32, className = '' }: MarqueeProps) {
  const track = [...items, ...items];

  return (
    <div
      className={`group relative flex overflow-hidden ${className}`}
      // Máscara de desvanecido en los bordes
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div
        className="flex shrink-0 items-center gap-4 pr-4 animate-marquee group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        {track.map((item, i) => (
          <div key={i} className="shrink-0">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
