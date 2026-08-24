import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useScrolled } from '../../hooks/useScrolled';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { NAV_LINKS, HASH_LINKS } from '../../lib/constants';
import { Button } from '../ui/Button';
import { useEarlyAccess } from '../early-access/EarlyAccess';
import logo from '../../assets/logo.png';
import studentPhoto from '../../assets/images/mockup/abril.webp';
import companyPhoto from '../../assets/images/mockup/comunidad-industrial.webp';
import ambassadorPhoto from '../../assets/images/mockup/comunidad-sistemas.webp';

export function Navbar() {
  const scrolled = useScrolled(20);
  const scrollDirection = useScrollDirection();
  // Colapsa el wordmark (queda solo el isotipo) al bajar, como en anthropic.com.
  const collapseWordmark = scrolled && scrollDirection === 'down';
  const [menuOpen, setMenuOpen] = useState(false);
  const { open } = useEarlyAccess();
  const desktopLinks = NAV_LINKS.filter((link) => link.to === '/');
  const audienceLinks = [
    {
      label: 'Estudiantes',
      to: '/estudiantes',
      description: 'Encontrá tu primera pasantía',
      photo: studentPhoto,
    },
    {
      label: 'Empresas',
      to: '/empresas',
      description: 'Conectá con talento joven',
      photo: companyPhoto,
    },
    {
      label: 'Embajadores',
      to: '/embajadores',
      description: 'Difundí oportunidades',
      photo: ambassadorPhoto,
    },
  ] as const;

  // Bloquea el scroll del fondo mientras el menú mobile está abierto.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className={`relative z-50 mx-auto mt-3 flex w-[min(1180px,92vw)] items-center justify-between rounded-full px-4 sm:px-6 transition-[background-color,border-color,box-shadow] duration-200 ${scrolled ? 'py-2.5' : 'py-[18px]'} ${
          scrolled
            ? 'border border-white/15 bg-brand-600/70 shadow-lg shadow-brand-950/20 backdrop-blur-md md:bg-white/[0.07] md:backdrop-blur-2xl'
            : 'border border-transparent bg-transparent'
        }`}
      >
        {/* Logo + marca: el wordmark se colapsa al bajar y reaparece al subir */}
        <Link to="/" className="flex items-center" aria-label="PasantIA — Inicio">
          <img
            src={logo}
            alt="PasantIA"
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <motion.span
            initial={false}
            animate={{
              width: collapseWordmark ? 0 : 'auto',
              opacity: collapseWordmark ? 0 : 1,
              marginLeft: collapseWordmark ? 0 : 4,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden whitespace-nowrap text-lg font-semibold tracking-tight"
          >
            asantIA
          </motion.span>
        </Link>

        {/* Links desktop */}
        <ul className="hidden items-center gap-1 md:flex">
          {desktopLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white focus:text-white focus:outline-none"
              aria-haspopup="menu"
            >
              Para quién
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-2 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-brand-950/25" role="menu">
                {audienceLinks.map(({ label, to, description, photo }) => (
                  <NavLink
                    key={to}
                    to={to}
                    role="menuitem"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <img
                      src={photo}
                      alt=""
                      aria-hidden
                      className="h-10 w-10 shrink-0 rounded-xl object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block truncate text-[11px] opacity-60">{description}</span>
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          </li>
          <li>
            <Link
              to="/#planes-desktop"
              className="rounded-full px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              Planes
            </Link>
          </li>
          {HASH_LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <Button as="link" to="/ingresar" variant="secondary" size="sm">
            Ingresar
          </Button>
          <Button onClick={() => open()} variant="landing" size="sm">
            Registrarse
          </Button>
        </div>

        {/* Botón menú mobile */}
        <button
          type="button"
          className="relative z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition-transform active:scale-90 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Menú mobile a pantalla completa */}
      {menuOpen && (
          <div
            className="fixed inset-x-0 top-0 z-40 flex h-[100dvh] flex-col bg-brand-600 md:hidden"
          >
            <nav
              className="flex flex-1 flex-col justify-center gap-5 px-4 pt-20"
            >
              <div className="grid grid-cols-2 gap-2">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-base font-semibold text-white"
                >
                  Inicio
                </NavLink>
                <Link
                  to="/#planes"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-base font-semibold text-white"
                >
                  Planes
                </Link>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Elegí tu perfil</p>
                <div className="grid grid-cols-3 gap-2">
                  {audienceLinks.map(({ label, to, photo }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.07] px-1.5 py-2.5 text-center text-[11px] font-semibold leading-tight text-white"
                  >
                    <img src={photo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                    <span className="w-full text-[10px]">{label}</span>
                  </NavLink>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/12 pt-3">
                {HASH_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="px-2 py-2 text-center text-sm font-medium text-white/70"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* CTA abajo */}
            <div
              className="flex w-full items-center justify-center gap-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            >
              <div className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button
                  as="link"
                  to="/ingresar"
                  variant="secondary"
                  size="lg"
                  className="w-full justify-center"
                >
                  Ingresar
                </Button>
              </div>
              <Button
                onClick={() => {
                  setMenuOpen(false);
                  open();
                }}
                variant="landing"
                size="lg"
                className="flex-1 justify-center"
              >
                Registrarse
              </Button>
            </div>
          </div>
      )}
    </header>
  );
}
