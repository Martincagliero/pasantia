import type { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Ancho del contenido interno. */
  contained?: boolean;
}

/**
 * Sección con espaciado vertical generoso (aire estilo SaaS premium).
 * padding vertical grande en desktop (~120-160px).
 */
export function Section({ children, id, className = '', contained = true }: SectionProps) {
  return (
    <section id={id} className={`relative overflow-x-clip py-24 sm:py-28 lg:py-36 ${className}`}>
      {contained ? <div className="container-px">{children}</div> : children}
    </section>
  );
}
