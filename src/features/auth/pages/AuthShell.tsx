// Layout compartido para las pantallas de acceso (login / registro).
// Centrado, con el logo y un panel glass. Sin navbar de marketing.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <img src={logo} alt="PasantIA" className="h-9 w-auto" />
        </Link>

        <div className="glass rounded-4xl border border-white/12 p-7 sm:p-9">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[15px] text-white/60">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-white/60">{footer}</div>}
      </div>
    </div>
  );
}
