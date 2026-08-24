// Página de ingreso (login) — con "P" 3D, campos con íconos y movimiento tilt.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { GoogleLogo } from '../GoogleLogo';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { useEarlyAccess } from '../../../components/early-access/EarlyAccess';
import loginLogo from '../../../assets/images/logoingresar.png';
import logoP from '../../../assets/images/logo-p-blanco.png';

const AUTH_RETURN_TO_KEY = 'pasantia_auth_return_to';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const { open: openEarlyAccess } = useEarlyAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  // Recordar la cuenta: guardamos el email en este dispositivo (la contraseña
  // la recuerda el gestor de contraseñas del navegador de forma segura).
  const REMEMBER_KEY = 'pasantia_remember_email';
  const rememberedEmail =
    typeof localStorage !== 'undefined' ? localStorage.getItem(REMEMBER_KEY) : null;

  const [email, setEmail] = useState(rememberedEmail ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!rememberedEmail);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Movimiento 3D según el mouse ---
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.4 });

  const pRotateY = useTransform(sx, [-0.5, 0.5], [-26, 26]);
  const pRotateX = useTransform(sy, [-0.5, 0.5], [14, -14]);

  function handleMove(e: React.MouseEvent) {
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // try/finally: si signIn tira una excepción inesperada (red caída, etc.)
    // el botón no debe quedar trabado en "Ingresando…" para siempre.
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setError(error);
        return;
      }
      // Recordar (o olvidar) la cuenta en este dispositivo.
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }
      navigate(from, { replace: true });
    } catch {
      setError('No pudimos conectar. Revisá tu internet e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    if (from.startsWith('/app/')) sessionStorage.setItem(AUTH_RETURN_TO_KEY, from);
    const { error } = await signInWithGoogle();
    if (error) {
      sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
      setError(error);
      setLoading(false);
    }
  }

  return (
    <div
      onMouseMove={handleMove}
      className="login-screen relative h-[100dvh] overflow-hidden bg-brand-500"
      style={{ perspective: 1200 }}
    >
      {/* Logo 3D flotante (desktop) */}
      <motion.div
        aria-hidden
        style={{ rotateX: pRotateX, rotateY: pRotateY, transformStyle: 'preserve-3d' }}
        className="pointer-events-none absolute bottom-[-5%] left-[2%] hidden select-none lg:block"
      >
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img
            src={loginLogo}
            alt=""
            className="h-[min(48vw,27rem)] w-[min(48vw,27rem)] object-contain drop-shadow-[0_30px_60px_rgba(2,14,56,0.35)]"
            style={{ transform: 'translateZ(50px)' }}
          />
        </motion.div>
      </motion.div>

      {/* Contenido */}
      <div className="relative z-10 flex h-full items-center justify-center px-4 py-[clamp(3.25rem,8vh,4.5rem)] sm:px-6">
        <div className="w-full max-w-[28rem]">
          <button
            type="button"
            onClick={() => navigate('/', { flushSync: true })}
            aria-label="Volver al inicio"
            className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-20 inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-white/80 transition hover:text-white sm:left-1/2 sm:-translate-x-1/2"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Volver al inicio</span>
          </button>

          <div className="rounded-2xl border border-white/25 bg-white/[0.10] p-[clamp(1rem,3vh,1.75rem)] shadow-[0_24px_70px_-24px_rgba(2,14,56,0.45)] backdrop-blur-xl">
            <div>
              <img src={logoP} alt="PasantIA" className="mx-auto mb-[clamp(.5rem,1.5vh,1rem)] h-[clamp(1.75rem,4vh,2.5rem)] w-auto" />

              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Bienvenido a PasantIA
              </h1>
              <p className="mt-1 text-sm text-white/75 sm:text-[15px]">
                Accedé a tu panel y seguí gestionando oportunidades.
              </p>

              {!isSupabaseConfigured && (
                <p className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100/90">
                  Falta configurar Supabase. Copiá <code>.env.example</code> a{' '}
                  <code>.env.local</code> con tus credenciales.
                </p>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-[clamp(.75rem,2vh,1.25rem)] flex w-full items-center justify-center gap-3 rounded-xl border border-white bg-white px-4 py-[clamp(.625rem,1.5vh,.75rem)] text-[15px] font-semibold text-brand-900 transition hover:bg-white/90 disabled:opacity-60"
              >
                <GoogleLogo />
                Continuar con Google
              </button>

              <div className="my-[clamp(.65rem,1.8vh,1rem)] flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-white/30" />
                <span className="text-xs font-medium uppercase text-white/65">o con email</span>
                <span className="h-px flex-1 bg-white/30" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-[clamp(.6rem,1.6vh,.9rem)]">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-white">
                    Email
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/30 bg-white/[0.12] px-3.5 transition focus-within:border-white focus-within:bg-white/[0.16]">
                    <Mail className="h-[18px] w-[18px] shrink-0 text-white/75" strokeWidth={1.75} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-transparent py-[clamp(.6rem,1.5vh,.75rem)] text-[15px] text-white placeholder:text-white/55 outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-white">
                    Contraseña
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/30 bg-white/[0.12] px-3.5 transition focus-within:border-white focus-within:bg-white/[0.16]">
                    <Lock className="h-[18px] w-[18px] shrink-0 text-white/75" strokeWidth={1.75} />
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent py-[clamp(.6rem,1.5vh,.75rem)] text-[15px] text-white placeholder:text-white/55 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="shrink-0 text-white/70 transition hover:text-white"
                      aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-400/25 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">
                    {error}
                  </p>
                )}

                {/* Recordar cuenta */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/85 select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 shrink-0 rounded border-white/50 bg-white/15 accent-white"
                    />
                    Recordar cuenta
                  </label>
                  <Link to="/recuperar-password" className="text-sm font-semibold text-white transition hover:text-white/75">
                    Olvidé mi contraseña
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-[clamp(.65rem,1.6vh,.8rem)] text-[15px] font-semibold text-brand-700 shadow-lg shadow-brand-950/20 transition hover:bg-brand-50 disabled:opacity-60"
                >
                  {loading ? 'Ingresando…' : (
                    <>
                      Ingresar <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="my-[clamp(.65rem,1.8vh,1rem)] h-px w-full bg-white/30" />

              <p className="text-center text-sm text-white/80">
                ¿Todavía no te sumaste?{' '}
                <button
                  type="button"
                  onClick={() => openEarlyAccess()}
                  className="font-semibold text-white underline decoration-white/50 underline-offset-4 transition hover:text-white/75"
                >
                  Creá tu cuenta
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
