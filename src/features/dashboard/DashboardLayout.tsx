// Layout del panel interno: barra de navegación superior (estilo LinkedIn) con
// buscador, más un panel de mensajes desplegable abajo a la derecha.
import { useEffect, useRef, useState } from 'react';
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
  Sun,
  Moon,
  Compass,
  Search,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useAuth } from '../auth/AuthProvider';
import { MessagesProvider } from '../messages/MessagesProvider';

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
  { to: '/app/explorar', label: 'Explorar perfiles', icon: Compass },
  { to: '/app/novedades', label: 'Novedades', icon: Newspaper },
  { to: '/app/perfil', label: 'Mi perfil', icon: UserRound },
];

const companyNav: NavItem[] = [
  { to: '/app/inicio', label: 'Resumen', icon: LayoutDashboard },
  { to: '/app/mis-pasantias', label: 'Mis pasantías', icon: Briefcase },
  { to: '/app/publicar', label: 'Publicar pasantía', icon: PlusCircle },
  { to: '/app/postulaciones-recibidas', label: 'Postulaciones', icon: Inbox },
  { to: '/app/talento', label: 'Buscar talento', icon: Users },
  { to: '/app/explorar', label: 'Explorar perfiles', icon: Compass },
  { to: '/app/novedades', label: 'Novedades', icon: Newspaper },
  { to: '/app/perfil', label: 'Perfil de empresa', icon: UserRound },
];

const ambassadorNav: NavItem[] = [
  { to: '/app/embajador', label: 'Resumen', icon: LayoutDashboard },
  { to: '/app/anuncios', label: 'Anuncios', icon: Megaphone },
  { to: '/app/ranking', label: 'Ranking', icon: Trophy },
  { to: '/app/explorar', label: 'Explorar perfiles', icon: Compass },
  { to: '/app/novedades', label: 'Novedades', icon: Newspaper },
  { to: '/app/embajador-perfil', label: 'Mi comunidad', icon: UserRound },
];

type Role = 'estudiante' | 'empresa' | 'embajador';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (typeof localStorage !== 'undefined' && (localStorage.getItem('dash-theme') as 'dark' | 'light')) || 'dark'
  );

  useEffect(() => {
    try {
      localStorage.setItem('dash-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const role: Role = (profile?.role as Role) ?? 'estudiante';
  const nav =
    role === 'estudiante' ? studentNav : role === 'empresa' ? companyNav : ambassadorNav;
  const perfilTo = role === 'embajador' ? '/app/embajador-perfil' : '/app/perfil';

  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(`/app/explorar${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setMobileOpen(false);
  }

  return (
    <div className="dash-root min-h-screen" data-theme={theme}>
      <MessagesProvider>
        <header className="dash-panel sticky top-0 z-40 border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
            <Link to="/" className="shrink-0">
              <img src={logo} alt="PasantIA" className="h-7 w-auto rounded-lg" />
            </Link>

            <form
              onSubmit={handleSearch}
              className="relative min-w-0 max-w-[220px] flex-1 sm:w-56 sm:flex-none"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar perfiles…"
                className="w-full rounded-full border border-white/12 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-400/60"
              />
            </form>

            <div className="ml-auto flex items-center gap-0.5">
              <nav className="hidden items-stretch lg:flex">
                {nav.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={label}
                    className={({ isActive }) =>
                      `group flex h-14 flex-col items-center justify-center gap-0.5 border-b-2 px-3 text-[11px] font-medium transition-colors ${
                        isActive
                          ? 'border-brand-400 text-brand-500'
                          : 'border-transparent text-white/55 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                    <span className="hidden max-w-[76px] truncate xl:block">{label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="mx-1.5 hidden h-7 w-px bg-white/10 lg:block" />

              <button
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                aria-label="Cambiar tema"
              >
                {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>

              {/* Cuenta */}
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-white/10"
                  aria-label="Cuenta"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                    {initials(profile?.full_name || '')}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-white/50 sm:block" />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-white/12 dash-panel shadow-2xl shadow-black/40">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">
                        {profile?.full_name || 'Cuenta'}
                      </p>
                      <p className="truncate text-xs text-white/45">{profile?.email}</p>
                    </div>
                    <Link
                      to={perfilTo}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <UserRound className="h-[18px] w-[18px]" /> Mi perfil
                    </Link>
                    <button
                      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                      {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-[18px] w-[18px]" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Menú mobile */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 lg:hidden"
                aria-label="Menú"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Nav mobile desplegable */}
          {mobileOpen && (
            <div className="border-t border-white/10 lg:hidden">
              <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-1 p-3 sm:grid-cols-3">
                {nav.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-brand-500 !text-white'
                          : 'text-white/70 hover:bg-white/[0.07] hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </MessagesProvider>
    </div>
  );
}
