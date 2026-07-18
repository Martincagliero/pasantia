// Layout del panel interno: barra lateral con navegación según el rol + contenido.
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Send,
  UserRound,
  Briefcase,
  PlusCircle,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Heart,
  Users,
  LogOut,
  Menu,
  X,
  Megaphone,
  Trophy,
  
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useAuth } from '../auth/AuthProvider';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const studentNav: NavItem[] = [
  { to: '/app/pasantias', label: 'Buscar pasantías', icon: LayoutGrid },
  { to: '/app/guardadas', label: 'Guardadas', icon: Heart },
  { to: '/app/postulaciones', label: 'Mis postulaciones', icon: Send },
  { to: '/app/comunidades', label: 'Mis comunidades', icon: Users },
  { to: '/app/novedades', label: 'Novedades', icon: Newspaper },
  { to: '/app/perfil', label: 'Mi perfil', icon: UserRound },
];

const companyNav: NavItem[] = [
  { to: '/app/inicio', label: 'Resumen', icon: LayoutDashboard },
  { to: '/app/mis-pasantias', label: 'Mis pasantías', icon: Briefcase },
  { to: '/app/publicar', label: 'Publicar pasantía', icon: PlusCircle },
  { to: '/app/postulaciones-recibidas', label: 'Postulaciones', icon: Inbox },
  { to: '/app/talento', label: 'Buscar talento', icon: Users },
  { to: '/app/novedades', label: 'Novedades', icon: Newspaper },
  { to: '/app/perfil', label: 'Perfil de empresa', icon: UserRound },
];

const ambassadorNav: NavItem[] = [
  { to: '/app/embajador', label: 'Resumen', icon: LayoutDashboard },
  { to: '/app/anuncios', label: 'Anuncios', icon: Megaphone },
  { to: '/app/ranking', label: 'Ranking', icon: Trophy },
  { to: '/app/novedades', label: 'Novedades', icon: Newspaper },
  { to: '/app/embajador-perfil', label: 'Mi comunidad', icon: UserRound },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '👤';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav =
    profile?.role === 'estudiante'
      ? studentNav
      : profile?.role === 'empresa'
        ? companyNav
        : ambassadorNav;

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const navContent = (
    <>
      <Link to="/" className="mb-8 flex items-center gap-2 px-2">
        <img src={logo} alt="PasantIA" className="h-8 w-auto" />
      </Link>

      <nav className="flex flex-col gap-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-medium transition ${
                isActive
                  ? 'bg-white/12 text-white before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sm font-bold text-white">
            {initials(profile?.full_name || '')}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {profile?.full_name || 'Cuenta'}
            </p>
            <p className="truncate text-xs text-white/50">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-medium text-white/65 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[22px] w-[22px]" strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      {/* Topbar mobile */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="PasantIA" className="h-7 w-auto" />
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-xl p-2 text-white/80 hover:bg-white/10"
          aria-label="Abrir menú"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 p-4 lg:flex">
          {navContent}
        </aside>

        {/* Drawer mobile */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-600 p-4 lg:hidden">
              {navContent}
            </aside>
          </>
        )}

        {/* Contenido */}
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
