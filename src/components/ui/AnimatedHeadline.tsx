import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedHeadlineProps {
  /** Cada elemento es una línea; se revela con máscara (slide up) escalonada. */
  lines: ReactNode[];
  className?: string;
  /** Retraso base antes de empezar. */
  delay?: number;
  /** Separación temporal entre líneas. */
  lineDelay?: number;
}

/**
 * Headline grande con reveal por línea (máscara + slide up), estilo go-marz.
 * Acepta nodos en cada línea, por lo que se pueden mezclar acentos serif.
 */
export function AnimatedHeadline({
  lines,
  className = '',
  delay = 0,
  lineDelay = 0.12,
}: AnimatedHeadlineProps) {
  const reduce = useReducedMotion();

  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className="block"
            initial={reduce ? { opacity: 0 } : { y: '110%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            transition={{
              duration: 0.9,
              delay: delay + i * lineDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
