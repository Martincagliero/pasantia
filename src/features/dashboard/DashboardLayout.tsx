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
  Users,
  LogOut,
  Megaphone,
  Trophy,
  Moon,
  Compass,
  Search,
  ChevronDown,
  Rocket,
  Shield,
  CircleHelp,
  House,
  CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useAuth } from '../auth/AuthProvider';
import { MessagesProvider, MessagesButton } from '../messages/MessagesProvider';
import { NotificationsButton } from '../notifications/NotificationsButton';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { WelcomeOnboarding } from '../onboarding/WelcomeOnboarding';
import { supabase } from '../../lib/supabase';
import { prefetchAppRoute, prefetchRoleRoutes } from '../../lib/prefetchApp';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const studentNav: NavItem[] = [
  { to: '/app/inicio-estudiante', label: 'Inicio', icon: House },
  { to: '/app/pasantias', label: 'Buscar pasantías', icon: LayoutGrid },
  { to: '/app/explorar', label: 'Explorar perfiles', icon: Compass },
  { to: '/app/comunidades', label: 'Mis comunidades', icon: Users },
  { to: '/app/promotores', label: 'Promotores', icon: Rocket },
  { to: '/app/postulaciones', label: 'Mis postulaciones', icon: Send },
  { to: '/app/perfil', label: 'Mi perfil', icon: UserRound },
];

const companyNav: NavItem[] = [
  { to: '/app/inicio', label: 'Resumen', icon: LayoutDashboard },
  { to: '/app/mis-pasantias', label: 'Mis pasantías', icon: Briefcase },
  { to: '/app/postulaciones-recibidas', label: 'Postulaciones', icon: Inbox },
  { to: '/app/explorar', label: 'Explorar talentos', icon: Compass },
  { to: '/app/novedades', label: 'Novedades', icon: Newspaper },
  { to: '/app/perfil', label: 'Perfil de empresa', icon: UserRound },
];

const ambassadorNav: NavItem[] = [
  { to: '/app/embajador', label: 'Resumen', icon: LayoutDashboard },
  { to: '/app/inicio-estudiante', label: 'Inicio', icon: House },
  { to: '/app/anuncios', label: 'Anuncios', icon: Megaphone },
  { to: '/app/ranking', label: 'Ranking', icon: Trophy },
  { to: '/app/explorar', label: 'Explorar perfiles', icon: Compass },
  { to: '/app/embajador-perfil', label: 'Mi comunidad', icon: UserRound },
];

type Role = 'estudiante' | 'empresa' | 'embajador';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function DashboardLayout() {
  const { profile, signOut, adminViewRole, setAdminViewRole } = useAuth();
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

  // Un admin puede elegir ver el panel de cualquier rol; el resto usa su rol real.
  const role: Role =
    profile?.is_admin && adminViewRole ? adminViewRole : ((profile?.role as Role) ?? 'estudiante');
  const nav =
    role === 'estudiante' ? studentNav : role === 'empresa' ? companyNav : ambassadorNav;
  const perfilTo = role === 'embajador' ? '/app/embajador-perfil' : '/app/perfil';
  // En mobile el perfil se accede desde el avatar de arriba, no en la barra inferior.
  const bottomNav = nav.filter(
    (item) => item.to !== perfilTo && !(role === 'estudiante' && item.to === '/app/postulaciones')
  );

  // Cambia el panel de rol que ve el admin y navega a su inicio.
  function switchAdminRole(next: Role | null) {
    setAdminViewRole(next);
    setAccountOpen(false);
    if (!next) {
      navigate('/app/admin');
      return;
    }
    navigate(
      next === 'empresa'
        ? '/app/inicio'
        : next === 'embajador'
          ? '/app/embajador'
          : '/app/inicio-estudiante'
    );
  }

  useEffect(() => {
    const warmRoutes = () => prefetchRoleRoutes(role, !!profile?.is_admin);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warmRoutes, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(warmRoutes, 350);
    return () => clearTimeout(timer);
  }, [role, profile?.is_admin]);

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

  // Compacta la barra inferior al bajar y recupera su tamaño al subir.
  const [compactBottomNav, setCompactBottomNav] = useState(false);
  const lastScrollYRef = useRef(0);
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const goingDown = y > lastScrollYRef.current;
      setCompactBottomNav(goingDown && y > 80);
      lastScrollYRef.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(`/app/buscar${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  }

  return (
    <div className={`dash-root min-h-screen ${role === 'embajador' ? 'dash-community' : ''}`} data-theme={theme}>
      <MessagesProvider>
        <WelcomeOnboarding />
        <header className="dash-panel sticky top-0 z-[45] border-b border-white/10 pt-[env(safe-area-inset-top)]">
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
                placeholder="Buscar en PasantIA…"
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
                    onMouseEnter={() => prefetchAppRoute(to)}
                    onFocus={() => prefetchAppRoute(to)}
                    onTouchStart={() => prefetchAppRoute(to)}
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

              {/* Mensajes (mobile: acceso desde la barra superior) */}
              <MessagesButton className="lg:hidden" />
              <NotificationCenter />

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
                  <div className="dash-panel absolute right-0 top-full mt-2 max-h-[calc(100dvh-env(safe-area-inset-top)-5rem)] w-56 overflow-y-auto rounded-2xl border border-white/12 shadow-2xl shadow-black/40">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">
                        {profile?.full_name || 'Cuenta'}
                      </p>
                      <p className="truncate text-xs text-white/45">{profile?.email}</p>
                    </div>
                    <Link
                      to={perfilTo}
                      onMouseEnter={() => prefetchAppRoute(perfilTo)}
                      onTouchStart={() => prefetchAppRoute(perfilTo)}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <UserRound className="h-[18px] w-[18px]" /> Mi perfil
                    </Link>
                    {role === 'estudiante' && (
                      <Link
                        to="/app/postulaciones"
                        onMouseEnter={() => prefetchAppRoute('/app/postulaciones')}
                        onTouchStart={() => prefetchAppRoute('/app/postulaciones')}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Send className="h-[18px] w-[18px]" /> Mis postulaciones
                      </Link>
                    )}
                    <Link
                      to="/app/planes"
                      onMouseEnter={() => prefetchAppRoute('/app/planes')}
                      onTouchStart={() => prefetchAppRoute('/app/planes')}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <CreditCard className="h-[18px] w-[18px] text-brand-500" /> Planes
                    </Link>
                    {profile?.is_admin && (
                      <>
                        <div className="my-1 border-t border-white/10" />
                        <p className="px-4 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                          Ver como (admin)
                        </p>
                        {([
                          { value: null, label: 'Administración', icon: Shield },
                          { value: 'estudiante' as Role, label: 'Estudiante', icon: House },
                          { value: 'empresa' as Role, label: 'Empresa', icon: Briefcase },
                          { value: 'embajador' as Role, label: 'Embajador', icon: Megaphone },
                        ] as const).map((opt) => {
                          const active =
                            opt.value === null ? !adminViewRole : adminViewRole === opt.value;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.label}
                              onClick={() => switchAdminRole(opt.value)}
                              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-white/[0.06] ${
                                active ? 'font-semibold text-brand-500' : 'text-white/80 hover:text-white'
                              }`}
                            >
                              <Icon className="h-[18px] w-[18px]" /> {opt.label}
                              {active && <span className="ml-auto h-2 w-2 rounded-full bg-brand-500" />}
                            </button>
                          );
                        })}
                        <div className="my-1 border-t border-white/10" />
                      </>
                    )}
                    <Link
                      to="/app/ayuda"
                      onMouseEnter={() => prefetchAppRoute('/app/ayuda')}
                      onTouchStart={() => prefetchAppRoute('/app/ayuda')}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <CircleHelp className="h-[18px] w-[18px]" /> Ayuda y soporte
                    </Link>
                    <NotificationsButton />
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

        <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-6 pb-28 sm:px-6 lg:pb-6">
          <Outlet />
        </main>

        {/* Barra inferior mobile: bloque flotante que se compacta al bajar.
            OJO iOS: NO usar backdrop-blur en un elemento position:fixed. Safari
            lo "despega" al hacer scroll y lo dibuja flotando en el medio de la
            pantalla. El fondo ya es opaco (mobile-end-gradient), así que el blur
            no aportaba nada visual. */}
        <nav
          className={`dash-panel mobile-end-gradient fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-md overflow-hidden rounded-2xl border border-white/12 shadow-xl shadow-black/20 transition-[transform,opacity] duration-300 ease-out lg:hidden ${
            compactBottomNav ? 'scale-[0.92] opacity-95' : 'scale-100 opacity-100'
          }`}
        >

          <div
            className={`mx-auto flex items-center justify-around transition-all duration-300 ${
              compactBottomNav ? 'h-11 px-5' : 'h-14 px-2'
            }`}
          >
            {bottomNav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                aria-label={label}
                onMouseEnter={() => prefetchAppRoute(to)}
                onFocus={() => prefetchAppRoute(to)}
                onTouchStart={() => prefetchAppRoute(to)}
                className={`flex shrink-0 items-center justify-center rounded-xl transition-all duration-300 active:scale-95 ${
                  compactBottomNav ? 'h-9 w-9' : 'h-11 w-11'
                }`}
              >
                {({ isActive }) => (
                  <Icon
                    className={`shrink-0 transition-all duration-300 ${
                      compactBottomNav ? 'h-5 w-5' : 'h-6 w-6'
                    } ${
                      isActive ? 'text-brand-500' : 'text-white/55'
                    }`}
                    strokeWidth={isActive ? 2.6 : 2}
                  />
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </MessagesProvider>
    </div>
  );
}
