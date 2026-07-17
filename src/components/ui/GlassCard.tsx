import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Activa hover con leve elevación. */
  interactive?: boolean;
}

/** Tarjeta glassmorphism con border-radius grande y borde sutil. */
export function GlassCard({ children, className = '', interactive = false }: GlassCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -6 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`glass rounded-3xl p-7 sm:p-8 ${
        interactive ? 'hover:bg-white/[0.08]' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
