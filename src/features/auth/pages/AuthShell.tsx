// Layout compartido para las pantallas de acceso (login / registro).
// Centrado, con el logo y un panel glass moderno. Sin navbar de marketing.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../../../assets/logo.png';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      {/* Fondo con gradiente moderno */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900" />
      
      {/* Elementos decorativos */}
      <div className="absolute -right-40 -top-40 -z-10 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -left-40 -bottom-40 -z-10 h-80 w-80 rounded-full bg-brand-600/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="mb-10 flex items-center justify-center gap-3">
          <img src={logo} alt="PasantIA" className="h-10 w-auto" />
          <span className="text-xl font-semibold text-white">PasantIA</span>
        </Link>

        <div className="space-y-6">
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-10 shadow-2xl backdrop-blur-xl">
            {/* Línea decorativa superior */}
            <div className="absolute left-0 top-0 h-1 w-12 rounded-full bg-gradient-to-r from-brand-500 to-transparent" />

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-base text-white/70">{subtitle}</p>}
            </div>
            
            <div className="mt-8">{children}</div>
          </div>

          {footer && (
            <div className="text-center text-sm text-white/60">
              {footer}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
