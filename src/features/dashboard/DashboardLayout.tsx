// Layout del panel interno: barra de navegación superior (estilo LinkedIn) con
// buscador, más un panel de mensajes desplegable abajo a la derecha.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Send,
  UserRound,
  Briefcase,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Heart,
  Users,
  LogOut,
  Megaphone,
  Trophy,
  Moon,
  Compass,
  Search,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useAuth } from '../auth/AuthProvider';
import { MessagesProvider } from '../messages/MessagesProvider';
import { supabase } from '../../lib/supabase';

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
  // Modo oscuro deshabilitado (próximamente): la app usa siempre modo claro.
  const theme = 'light' as const;

  useEffect(() => {
    try {
      localStorage.setItem('dash-theme', 'light');
    } catch {
      /* ignore */
    }
  }, []);

  const role: Role = (profile?.role as Role) ?? 'estudiante';
  const nav =
    role === 'estudiante' ? studentNav : role === 'empresa' ? companyNav : ambassadorNav;
  const perfilTo = role === 'embajador' ? '/app/embajador-perfil' : '/app/perfil';
  // En mobile el perfil se accede desde el avatar de arriba, no en la barra inferior.
  const bottomNav = nav.filter((item) => item.to !== perfilTo);

  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Carga la foto de perfil del usuario según su rol (avatar_url para
  // estudiante/empresa, logo_url para embajador) para mostrarla en el círculo.
  useEffect(() => {
    const uid = profile?.id;
    if (!uid) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const table =
        role === 'empresa'
          ? 'company_profiles'
          : role === 'embajador'
            ? 'ambassador_profiles'
            : 'student_profiles';
      const column = role === 'embajador' ? 'logo_url' : 'avatar_url';
      const { data } = await supabase.from(table).select(column).eq('id', uid).maybeSingle();
      if (cancelled) return;
      const url = (data as Record<string, string | null> | null)?.[column] ?? null;
      setAvatarUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, role]);

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
  }

  return (
    <div className="dash-root app-shrink min-h-screen" data-theme={theme}>
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
                disabled
                className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full text-white/35"
                title="Modo oscuro · Próximamente"
                aria-label="Modo oscuro (próximamente)"
              >
                <Moon className="h-[18px] w-[18px]" />
              </button>

              {/* Cuenta */}
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-white/10"
                  aria-label="Cuenta"
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/15 text-xs font-bold text-white">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profile?.full_name || 'Perfil'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      initials(profile?.full_name || '')
                    )}
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
                    <div
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-white/40"
                      title="Próximamente"
                    >
                      <Moon className="h-[18px] w-[18px]" />
                      Modo oscuro
                      <span className="ml-auto rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/50">
                        Próximamente
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-[18px] w-[18px]" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:pb-6">
          <Outlet />
        </main>

        {/* Barra de navegación inferior (mobile, estilo LinkedIn) */}
        <nav className="dash-panel fixed inset-x-0 bottom-0 z-40 border-t border-white/10 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-stretch">
            {bottomNav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-brand-500' : 'text-white/55 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.9} />
                <span className="w-full truncate text-center leading-tight">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </MessagesProvider>
    </div>
  );
}
