import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMediaQuery, useTouchDevice } from '../../hooks/useMediaQuery';

/**
 * Transición de página con fade + slide sutil.
 * Se usa junto a AnimatePresence en App para evitar saltos bruscos al navegar.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const isTouchDevice = useTouchDevice();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const limitMotion = isTouchDevice || isMobile;

  if (limitMotion) {
    return <main className="overflow-x-clip">{children}</main>;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-x-clip"
    >
      {children}
    </motion.main>
  );
}
