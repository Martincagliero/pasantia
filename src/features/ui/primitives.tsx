// Primitivas visuales compartidas del sistema interno.
import type { ReactNode } from 'react';
import type { ApplicationStatus } from '../../lib/database.types';
import { STATUS_META, normalizeStatus } from './applicationStatus';

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  /** activa el efecto premium (sube y muestra sombra al pasar el mouse) */
  hover?: boolean;
}) {
  return (
    <div
      className={`dash-card-accent glass relative rounded-2xl border border-white/12 p-3 sm:p-5 ${
        hover
          ? 'transition duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-xl hover:shadow-brand-950/30'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white ${className}`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="animate-pulse space-y-4 py-2" aria-label="Cargando contenido" role="status">
      <div className="h-7 w-52 rounded-lg bg-white/10" />
      <div className="h-4 w-full max-w-md rounded bg-white/[0.06]" />
      <div className="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-36 rounded-2xl border border-white/8 bg-white/[0.04]" />
        <div className="h-36 rounded-2xl border border-white/8 bg-white/[0.04]" />
        <div className="hidden h-36 rounded-2xl border border-white/8 bg-white/[0.04] lg:block" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="glass rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center sm:px-6 sm:py-10">
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[normalizeStatus(status)];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/65">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {meta.label}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
