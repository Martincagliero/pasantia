import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp, viewportOnce } from '../../lib/motion';
import { useMediaQuery, useTouchDevice } from '../../hooks/useMediaQuery';

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /** Retraso en segundos antes de animar. */
  delay?: number;
  as?: 'div' | 'section' | 'span' | 'li';
}

/**
 * Envuelve contenido con un scroll-reveal (fade + translateY) que se dispara
 * una sola vez al entrar al viewport. Respeta prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, className, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  const isTouchDevice = useTouchDevice();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const limitMotion = isTouchDevice || isMobile;

  if (reduce || limitMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
