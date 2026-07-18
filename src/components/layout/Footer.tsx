import { Link } from 'react-router-dom';
import { CONTACT } from '../../lib/constants';
import { useEarlyAccess } from '../early-access/EarlyAccess';
import logo from '../../assets/logo.png';

// Estilo de link del footer (texto bold blanco, sin íconos — igual que la referencia).
const linkClass =
  'text-left text-[15px] font-semibold text-white/85 transition-colors hover:text-white';

export function Footer() {
  const year = new Date().getFullYear();
  const { open } = useEarlyAccess();

  return (
    <footer className="relative border-t border-white/10 bg-brand-950/40">
      <div className="container-px py-20">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-[1.6fr_1fr_1fr]">
          {/* Marca + tagline */}
          <div>
            <Link
              to="/"
              className="flex items-center gap-2.5"
              aria-label="PasantIA — Inicio"
            >
              <img
                src={logo}
                alt="PasantIA"
                className="h-10 w-10 rounded-lg object-contain"
              />
              <span className="text-2xl font-semibold tracking-tight">PasantIA</span>
            </Link>
            <p className="mt-5 max-w-xs text-[15px] font-light leading-relaxed text-white/60">
              Conectamos estudiantes con empresas para gestionar pasantías, sin buscar
              a ciegas.
            </p>
          </div>

          {/* Columna 1: navegación */}
          <nav className="flex flex-col gap-4" aria-label="Navegación del pie">
            <Link to="/" className={linkClass}>
              Inicio
            </Link>
            <Link to="/estudiantes" className={linkClass}>
              Estudiantes
            </Link>
            <Link to="/empresas" className={linkClass}>
              Empresas
            </Link>
            <button type="button" onClick={() => open()} className={linkClass}>
              Acceso anticipado
            </button>
          </nav>

          {/* Columna 2: contacto, redes y legal */}
          <div className="flex flex-col gap-4">
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Instagram
            </a>
            <a href={`mailto:${CONTACT.email}`} className={linkClass}>
              Email
            </a>
            {/* Páginas legales */}
            <Link to="/politica-de-privacidad" className={linkClass}>
              Política de privacidad
            </Link>
            <Link to="/terminos" className={linkClass}>
              Términos y condiciones de uso
            </Link>
            <Link to="/normas-comunidad" className={linkClass}>
              Normas de la comunidad
            </Link>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="text-sm text-white/50">
            © {year} PasantIA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
