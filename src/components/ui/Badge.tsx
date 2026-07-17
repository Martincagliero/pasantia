import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Pill glassmorphism que se usa arriba de los headlines (estilo referencia). */
export function Badge({ children, icon, className = '' }: BadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-white/80 ${className}`}
    >
      {icon && <span className="text-white/90">{icon}</span>}
      {children}
    </motion.span>
  );
}
