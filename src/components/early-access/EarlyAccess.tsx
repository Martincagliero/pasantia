import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import {
  CONTACT,
  FORM_ENDPOINT,
  FORM_OPTIONS,
  SUPABASE_ANON_KEY,
  SUPABASE_TABLE,
  SUPABASE_URL,
  UNIVERSIDADES,
} from '../../lib/constants';
import { IMAGES } from '../../lib/images';
import estudianteImg from '../../assets/images/estudiante.jpg';
import logo from '../../assets/logo.png';

type Role = 'estudiante' | 'empresa' | 'embajador';

interface EarlyAccessContextValue {
  open: (role?: Role) => void;
}

const EarlyAccessContext = createContext<EarlyAccessContextValue | null>(null);

export function useEarlyAccess(): EarlyAccessContextValue {
  const ctx = useContext(EarlyAccessContext);
  if (!ctx) throw new Error('useEarlyAccess debe usarse dentro de <EarlyAccessProvider>');
  return ctx;
}

interface FormData {
  role: Role | '';
  nombre: string;
  email: string;
  telefono: string;
  universidad: string;
  carrera: string;
  anio: string;
  area: string;
  disponibilidad: string;
  empresa: string;
  rubro: string;
  tamano: string;
  perfil: string;
  org_name: string;
  org_type: string;
  reach: string;
  mensaje: string;
}

const EMPTY: FormData = {
  role: '',
  nombre: '',
  email: '',
  telefono: '',
  universidad: '',
  carrera: '',
  anio: '',
  area: '',
  disponibilidad: '',
  empresa: '',
  rubro: '',
  tamano: '',
  perfil: '',
  org_name: '',
  org_type: '',
  reach: '',
  mensaje: '',
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type Screen =
  | 'role'
  | 'contacto'
  | 'eduUni'
  | 'eduArea'
  | 'empBasic'
  | 'empDetail'
  | 'mensaje';

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [presetRole, setPresetRole] = useState<Role | undefined>(undefined);

  const open = useCallback((role?: Role) => {
    setPresetRole(role);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <EarlyAccessContext.Provider value={value}>
      {children}
      <Onboarding isOpen={isOpen} presetRole={presetRole} onClose={close} />
    </EarlyAccessContext.Provider>
  );
}

/* --------------------------- Onboarding full-screen --------------------------- */

function Onboarding({
  isOpen,
  presetRole,
  onClose,
}: {
  isOpen: boolean;
  presetRole?: Role;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setData({ ...EMPTY, role: presetRole ?? '' });
      setStep(0);
      setSubmitted(false);
      setError(null);
      setSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, presetRole]);

  const set = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }));

  const screens: Screen[] = useMemo(() => {
    const base: Screen[] = presetRole ? [] : ['role'];
    if (data.role === 'estudiante')
      return [...base, 'contacto', 'eduUni', 'eduArea', 'mensaje'];
    if (data.role === 'empresa')
      return [...base, 'contacto', 'empBasic', 'empDetail', 'mensaje'];
    if (data.role === 'embajador')
      return [...base, 'contacto', 'mensaje'];
    return base;
  }, [presetRole, data.role]);

  const current = screens[step] ?? 'role';
  const isLast = step === screens.length - 1;

  const canContinue = (): boolean => {
    switch (current) {
      case 'role':
        return data.role !== '';
      case 'contacto':
        return data.nombre.trim().length > 1 && isEmail(data.email);
      case 'eduUni':
        return data.universidad.trim() !== '' && data.carrera.trim() !== '';
      case 'eduArea':
        return data.area !== '';
      case 'empBasic':
        return data.empresa.trim() !== '' && data.rubro !== '';
      default:
        return true;
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, screens.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Cerrar con Escape; avanzar con Enter (si es válido y no estamos en textarea).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (
        e.key === 'Enter' &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !submitted
      ) {
        if (isLast) return;
        if (canContinue()) {
          e.preventDefault();
          next();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, current, data, submitted, isLast]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const payload = {
      rol: data.role,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      universidad: data.universidad,
      carrera: data.carrera,
      anio: data.anio,
      area: data.area,
      disponibilidad: data.disponibilidad,
      empresa: data.empresa,
      rubro: data.rubro,
      tamano: data.tamano,
      perfil: data.perfil,
      mensaje: data.mensaje,
      origen: typeof window !== 'undefined' ? window.location.pathname : '',
    };

    try {
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('supabase');
      } else if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: `Acceso anticipado (${data.role || 'sin rol'}) — PasantIA`,
            ...payload,
          }),
        });
        if (!res.ok) throw new Error('formspree');
      } else {
        const lines = Object.entries(payload)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`);
        const subject = `Acceso anticipado (${data.role || 'sin rol'}) — PasantIA`;
        window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(lines.join('\n'))}`;
      }
      setSubmitted(true);
    } catch {
      setError(
        `No pudimos enviar tu solicitud. Probá de nuevo o escribinos a ${CONTACT.email}.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  const progress = submitted ? 1 : (step + 1) / Math.max(screens.length, 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col bg-brand-600"
          role="dialog"
          aria-modal="true"
          aria-label="Registro de acceso anticipado"
        >
          {/* Glows de fondo */}
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-white/10 blur-[130px] sm:h-[36rem] sm:w-[36rem]" />

          {/* Header */}
          <header className="flex items-center justify-between px-5 py-4 sm:px-10 sm:py-5">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="PasantIA" className="h-8 w-8 rounded-lg object-contain" />
              <span className="text-lg font-semibold tracking-tight">PasantIA</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={22} />
            </button>
          </header>

          {/* Barra de progreso */}
          <div className="h-0.5 w-full bg-white/10">
            <motion.div
              className="h-full bg-white"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Contenido */}
          <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-10">
            {submitted ? (
              <Success role={data.role} onClose={onClose} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={current + step}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-md sm:max-w-lg md:max-w-2xl"
                >
                  {current === 'role' && (
                    <StepRole
                      value={data.role}
                      onPick={(role) => {
                        set({ role });
                        // Tras elegir rol siempre vamos al paso de contacto (índice 1).
                        setTimeout(() => setStep(1), 150);
                      }}
                    />
                  )}
                  {current === 'contacto' && <StepContacto data={data} set={set} />}
                  {current === 'eduUni' && <StepEduUni data={data} set={set} />}
                  {current === 'eduArea' && <StepEduArea data={data} set={set} />}
                  {current === 'empBasic' && <StepEmpBasic data={data} set={set} />}
                  {current === 'empDetail' && <StepEmpDetail data={data} set={set} />}
                  {current === 'mensaje' && <StepMensaje data={data} set={set} error={error} />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer navegación */}
          {!submitted && current !== 'role' && (
            <footer className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-sm sm:gap-4 sm:px-10 sm:py-5">
              <button
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-0"
              >
                <ArrowLeft size={16} />
                Atrás
              </button>

              <span className="text-sm text-white/40">
                Paso {step + 1} de {screens.length}
              </span>

              {isLast ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-950 hover:text-white disabled:opacity-60"
                >
                  {submitting ? 'Enviando…' : 'Enviar'}
                  {!submitting && <Check size={16} />}
                </button>
              ) : (
                <button
                  onClick={next}
                  disabled={!canContinue()}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar
                  <ArrowRight size={16} />
                </button>
              )}
            </footer>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Steps ------------------------------ */

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 sm:mb-10 text-center">
      <h2 className="text-xl font-semibold tracking-tighter sm:text-3xl md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-2 sm:mt-4 text-sm sm:text-base md:text-lg font-light text-white/60">{subtitle}</p>}
    </div>
  );
}

function StepRole({
  value,
  onPick,
}: {
  value: FormData['role'];
  onPick: (r: Role) => void;
}) {
  const opts = [
    {
      role: 'estudiante' as const,
      img: estudianteImg,
      objectPos: 'object-[50%_32%]',
      label: 'Soy estudiante',
      desc: 'Busco una pasantía',
    },
    {
      role: 'empresa' as const,
      img: IMAGES.officeTeam,
      objectPos: 'object-center',
      label: 'Soy empresa',
      desc: 'Busco talento joven',
    },
    {
      role: 'embajador' as const,
      img: IMAGES.ambassadorCommunity,
      objectPos: 'object-center',
      label: 'Soy comunidad / embajador',
      desc: 'Comparto oportunidades con mi comunidad',
    },
  ];
  return (
    <div>
      <Heading title="¿Cómo querés sumarte?" subtitle="Elegí una opción para empezar." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {opts.map((o) => (
          <button
            key={o.role}
            onClick={() => onPick(o.role)}
            className={`group overflow-hidden rounded-2xl border p-2 text-left transition-all duration-200 sm:rounded-3xl sm:p-3 ${
              value === o.role
                ? 'border-white bg-white/10'
                : 'border-white/15 bg-white/[0.03] hover:border-white/40 hover:bg-white/[0.07]'
            }`}
          >
            <div className="overflow-hidden rounded-xl sm:rounded-2xl">
              <img
                src={o.img}
                alt=""
                aria-hidden
                loading="lazy"
                className={`h-24 w-full object-cover sm:h-32 md:h-40 ${o.objectPos} transition-transform duration-500 group-hover:scale-105`}
              />
            </div>
            <div className="px-2 pb-1.5 pt-3 sm:px-3 sm:pb-2 sm:pt-4">
              <span className="block text-base font-semibold sm:text-xl">{o.label}</span>
              <span className="mt-0.5 block text-sm text-white/55 sm:mt-1">{o.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepContacto({
  data,
  set,
}: {
  data: FormData;
  set: (p: Partial<FormData>) => void;
}) {
  return (
    <div className="mx-auto max-w-md">
      <Heading title="Empecemos por tus datos" />
      <div className="space-y-4">
        <Input
          label="Nombre y apellido"
          value={data.nombre}
          onChange={(v) => set({ nombre: v })}
          placeholder="Tu nombre"
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          value={data.email}
          onChange={(v) => set({ email: v })}
          placeholder="tucorreo@email.com"
        />
        <Input
          label="Teléfono (opcional)"
          value={data.telefono}
          onChange={(v) => set({ telefono: v })}
          placeholder="+54 9 ..."
        />
      </div>
    </div>
  );
}

function StepEduUni({
  data,
  set,
}: {
  data: FormData;
  set: (p: Partial<FormData>) => void;
}) {
  return (
    <div className="mx-auto max-w-md">
      <Heading title="¿Dónde estudiás?" />
      <div className="space-y-4">
        <Autocomplete
          label="Universidad / Instituto"
          value={data.universidad}
          onChange={(v) => set({ universidad: v })}
          options={UNIVERSIDADES}
          placeholder="Escribí o elegí (ICES, San José, UCSE…)"
        />
        <Input
          label="Carrera"
          value={data.carrera}
          onChange={(v) => set({ carrera: v })}
          placeholder="Ej: Ing. en Sistemas"
        />
      </div>
    </div>
  );
}

function StepEduArea({
  data,
  set,
}: {
  data: FormData;
  set: (p: Partial<FormData>) => void;
}) {
  return (
    <div>
      <Heading title="¿Qué te interesa?" subtitle="Elegí un área. Después ajustamos el resto." />
      <ChipGroup
        options={FORM_OPTIONS.areasInteres}
        value={data.area}
        onChange={(v) => set({ area: v })}
      />
      <div className="mx-auto mt-6 sm:mt-10 max-w-md space-y-4 sm:space-y-6">
        <SubGroup label="Año de cursada">
          <ChipGroup
            small
            options={FORM_OPTIONS.anioCursada}
            value={data.anio}
            onChange={(v) => set({ anio: v })}
          />
        </SubGroup>
        <SubGroup label="Disponibilidad">
          <ChipGroup
            small
            options={FORM_OPTIONS.disponibilidad}
            value={data.disponibilidad}
            onChange={(v) => set({ disponibilidad: v })}
          />
        </SubGroup>
      </div>
    </div>
  );
}

function StepEmpBasic({
  data,
  set,
}: {
  data: FormData;
  set: (p: Partial<FormData>) => void;
}) {
  return (
    <div>
      <Heading title="Contanos sobre tu empresa" />
      <div className="mx-auto mb-6 sm:mb-8 max-w-md">
        <Input
          label="Empresa"
          value={data.empresa}
          onChange={(v) => set({ empresa: v })}
          placeholder="Nombre de la empresa"
          autoFocus
        />
      </div>
      <SubGroup label="Rubro" center>
        <ChipGroup
          options={FORM_OPTIONS.rubros}
          value={data.rubro}
          onChange={(v) => set({ rubro: v })}
        />
      </SubGroup>
    </div>
  );
}

function StepEmpDetail({
  data,
  set,
}: {
  data: FormData;
  set: (p: Partial<FormData>) => void;
}) {
  return (
    <div>
      <Heading title="¿Qué estás buscando?" />
      <SubGroup label="Tamaño del equipo" center>
        <ChipGroup
          options={FORM_OPTIONS.tamanoEmpresa}
          value={data.tamano}
          onChange={(v) => set({ tamano: v })}
        />
      </SubGroup>
      <div className="mx-auto mt-6 sm:mt-8 max-w-md">
        <Input
          label="Perfil que buscás (opcional)"
          value={data.perfil}
          onChange={(v) => set({ perfil: v })}
          placeholder="Ej: pasante de marketing"
        />
      </div>
    </div>
  );
}

function StepMensaje({
  data,
  set,
  error,
}: {
  data: FormData;
  set: (p: Partial<FormData>) => void;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-md">
      <Heading title="¿Algo más que quieras contarnos?" subtitle="Opcional." />
      <textarea
        rows={5}
        value={data.mensaje}
        onChange={(e) => set({ mensaje: e.target.value })}
        placeholder="Contanos qué estás buscando…"
        className={`${inputCls} resize-none`}
      />
      <p className="mt-4 text-center text-sm text-white/45">
        Al enviar, sumamos tus datos a la lista de acceso anticipado de PasantIA.
      </p>
      {error && (
        <p className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}
    </div>
  );
}

function Success({ role, onClose }: { role: FormData['role']; onClose: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 sm:h-20 sm:w-20"
      >
        <Check size={38} />
      </motion.div>
      <h2 className="mt-8 text-3xl font-semibold tracking-tighter xs:text-4xl sm:text-5xl">
        ¡Estás en la lista!
      </h2>
      <p className="mx-auto mt-5 max-w-md text-lg font-light text-white/65">
        Recibimos tu registro. Te contactamos apenas abramos el acceso
        {role === 'empresa'
          ? ' para empresas.'
          : role === 'estudiante'
            ? ' para estudiantes.'
            : '.'}
      </p>
      <button
        onClick={onClose}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-950 hover:text-white"
      >
        Volver al sitio
      </button>
    </div>
  );
}

/* ------------------------------ UI atoms ------------------------------ */

const inputCls =
  'w-full rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3.5 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/40 focus:bg-white/[0.1]';

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block text-left">
      <span className="mb-2 block text-sm font-medium text-white/75">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={inputCls}
      />
    </label>
  );
}

function SubGroup({
  label,
  children,
  center,
}: {
  label: string;
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? 'text-center' : 'text-left'}>
      <span className="mb-3 block text-sm font-medium text-white/75">{label}</span>
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
  small,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  small?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2.5">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-full border transition-all duration-200 ${
              small
                ? 'px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm'
                : 'px-3 py-1.5 text-xs sm:px-5 sm:py-2.5 sm:text-[15px]'
            } ${
              active
                ? 'border-white bg-white text-brand-600'
                : 'border-white/15 bg-white/[0.04] text-white/80 hover:border-white/40 hover:bg-white/[0.08]'
            } font-medium`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Autocomplete({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLabelElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(value.trim().toLowerCase())
  );
  const show = open && filtered.length > 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <label className="relative block text-left" ref={ref}>
      <span className="mb-2 block text-sm font-medium text-white/75">{label}</span>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoFocus
        autoComplete="off"
        className={inputCls}
      />
      <AnimatePresence>
        {show && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-white/15 bg-brand-700 p-1.5 shadow-2xl shadow-brand-950/60"
          >
            {filtered.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(o);
                    setOpen(false);
                  }}
                  className="block w-full rounded-xl px-4 py-2.5 text-left text-[15px] text-white/85 transition-colors hover:bg-white/10"
                >
                  {o}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </label>
  );
}
