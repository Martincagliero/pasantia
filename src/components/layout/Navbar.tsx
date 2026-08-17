import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useScrolled } from '../../hooks/useScrolled';
import { NAV_LINKS, HASH_LINKS } from '../../lib/constants';
import { Button } from '../ui/Button';
import { useEarlyAccess } from '../early-access/EarlyAccess';
import logo from '../../assets/logo.png';
import studentPhoto from '../../assets/images/mockup/abril.webp';
import companyPhoto from '../../assets/images/mockup/comunidad-industrial.webp';
import ambassadorPhoto from '../../assets/images/mockup/comunidad-sistemas.webp';

export function Navbar() {
  const scrolled = useScrolled(20);
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
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <motion.nav
        animate={{
          paddingTop: scrolled ? 10 : 18,
          paddingBottom: scrolled ? 10 : 18,
        }}
        transition={{ duration: 0.3 }}
        className={`relative z-50 mx-auto mt-3 flex w-[min(1180px,92vw)] items-center justify-between rounded-full px-4 sm:px-6 transition-all duration-300 ${
          scrolled
            ? 'border border-white/15 bg-brand-600/70 shadow-lg shadow-brand-950/20 backdrop-blur-md md:bg-white/[0.07] md:backdrop-blur-2xl'
            : 'border border-transparent bg-transparent'
        }`}
      >
        {/* Logo + marca */}
        <Link to="/" className="flex items-center gap-1" aria-label="PasantIA — Inicio">
          <img
            src={logo}
            alt="PasantIA"
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="text-lg font-semibold tracking-tight">asantIA</span>
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
      </motion.nav>

      {/* Menú mobile a pantalla completa */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 top-0 z-40 flex h-[100dvh] flex-col bg-brand-600 md:hidden"
          >
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />

            {/* Links centrados */}
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
              }}
              className="flex flex-1 flex-col items-center justify-center gap-7 px-6"
            >
              {NAV_LINKS.map((link) => (
                <motion.div
                  key={link.to}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-2xl font-medium tracking-tight transition-colors ${
                        isActive ? 'text-white' : 'text-white/60 hover:text-white'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              {HASH_LINKS.map((link) => (
                <motion.div
                  key={link.to}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl font-medium tracking-tight text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            {/* CTA abajo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex w-full items-center justify-center gap-2 px-6 pb-12"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
