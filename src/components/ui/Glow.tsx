interface GlowProps {
  className?: string;
  /** Color del resplandor (por defecto blanco muy sutil). */
  color?: string;
}

/**
 * Resplandor decorativo (blob difuminado) para dar profundidad al fondo azul.
 * Es puramente decorativo (aria-hidden) y no interactúa.
 */
export function Glow({ className = '', color = 'rgba(255,255,255,0.14)' }: GlowProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -z-10 rounded-full blur-[120px] animate-glow-pulse ${className}`}
      style={{ background: color }}
    />
  );
}
