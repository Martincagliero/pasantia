import type { ReactNode } from 'react';

/**
 * Énfasis por variación de peso (Montserrat Light), sin itálicas.
 * Crea contraste tipográfico dentro de titulares en semibold/bold.
 */
export function Accent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-light text-white/95 ${className}`}>
      {children}
    </span>
  );
}
