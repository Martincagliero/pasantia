// Página de ingreso (login) — con "P" 3D, campos con íconos y movimiento 3D (tilt/parallax).
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { useEarlyAccess } from '../../../components/early-access/EarlyAccess';
import logo from '../../../assets/logo.png';
import loginLogo from '../../../assets/images/logoingresar.png';

export default function Login() {
  const { signIn } = useAuth();
  const { open: openEarlyAccess } = useEarlyAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
  const glowX = useTransform(sx, [-0.5, 0.5], [40, -40]);
  const glowY = useTransform(sy, [-0.5, 0.5], [40, -40]);

  function handleMove(e: React.MouseEvent) {
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <div
      onMouseMove={handleMove}
      className="relative min-h-screen overflow-hidden bg-[#05070E]"
      style={{ perspective: 1200 }}
    >
      {/* Fondo decorativo con parallax */}
      <motion.div style={{ x: glowX, y: glowY }} className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/25 blur-[140px]" />
        <div className="absolute -bottom-52 -right-32 h-[36rem] w-[36rem] rounded-full bg-brand-600/20 blur-[150px]" />
        <span className="absolute right-[20%] top-[38%] h-1 w-1 rounded-full bg-brand-300/50" />
        <span className="absolute left-[14%] bottom-[22%] h-1.5 w-1.5 rounded-full bg-white/15" />
      </motion.div>

      {/* Logo 3D flotante (desktop) */}
      <motion.div
        aria-hidden
        style={{ rotateX: pRotateX, rotateY: pRotateY, transformStyle: 'preserve-3d' }}
        className="pointer-events-none absolute left-[5%] top-1/2 hidden -translate-y-1/2 select-none lg:block"
      >
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-6 -z-10 rounded-full bg-brand-500/25 blur-[90px]" />
          <img
            src={loginLogo}
            alt=""
            className="h-[26rem] w-[26rem] object-contain drop-shadow-[0_30px_60px_rgba(20,45,130,0.5)]"
            style={{ transform: 'translateZ(50px)' }}
          />
        </motion.div>
      </motion.div>

      {/* Contenido */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-6 sm:py-12">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-4 inline-flex w-full items-center justify-center gap-1.5 text-sm text-white/45 transition hover:text-white/80 sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>

          {/* Logo (mobile) */}
          <img
            src={loginLogo}
            alt=""
            aria-hidden
            className="mx-auto mb-3 h-24 w-24 object-contain drop-shadow-[0_16px_30px_rgba(20,45,130,0.5)] lg:hidden"
          />

          <div className="rounded-2xl border border-white/10 bg-[#0B0F1A]/80 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/[0.05] backdrop-blur-xl sm:p-8">
            <div>
              <img src={logo} alt="PasantIA" className="mb-5 hidden h-9 w-auto lg:block" />

              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Bienvenido a <span className="text-brand-400">PasantIA</span>
              </h1>
              <p className="mt-1 text-sm text-white/50 sm:mt-1.5 sm:text-[15px]">
                Accedé a tu panel y seguí gestionando oportunidades.
              </p>

              {!isSupabaseConfigured && (
                <p className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100/90">
                  Falta configurar Supabase. Copiá <code>.env.example</code> a{' '}
                  <code>.env.local</code> con tus credenciales.
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/75">
                    Email
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#12151E] px-3.5 transition focus-within:border-brand-400/60">
                    <Mail className="h-[18px] w-[18px] shrink-0 text-white/40" strokeWidth={1.75} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-transparent py-3 text-[15px] text-white placeholder:text-white/35 outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/75">
                    Contraseña
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#12151E] px-3.5 transition focus-within:border-brand-400/60">
                    <Lock className="h-[18px] w-[18px] shrink-0 text-white/40" strokeWidth={1.75} />
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent py-3 text-[15px] text-white placeholder:text-white/35 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="shrink-0 text-white/35 transition hover:text-white/70"
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

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:from-brand-500 hover:to-brand-300 disabled:opacity-60"
                >
                  {loading ? 'Ingresando…' : (
                    <>
                      Ingresar <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divisor con punto */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="h-px w-full bg-white/10" />
                <span className="absolute flex h-6 w-6 items-center justify-center rounded-full border border-white/12 bg-[#0a0c14]">
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                </span>
              </div>

              <p className="text-center text-sm text-white/50">
                ¿Todavía no te sumaste?{' '}
                <button
                  type="button"
                  onClick={() => openEarlyAccess()}
                  className="font-semibold text-brand-400 transition hover:text-brand-300"
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
