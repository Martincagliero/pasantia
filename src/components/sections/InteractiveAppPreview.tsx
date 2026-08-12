import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ComponentType } from 'react';
import {
  Building2,
  ChevronDown,
  Clock3,
  Compass,
  Copy,
  ExternalLink,
  Flag,
  GraduationCap,
  Heart,
  Info,
  LayoutGrid,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Plus,
  Rocket,
  Search,
  Send,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { Reveal } from '../ui/Reveal';

type PreviewId = 'novedades' | 'pasantias' | 'perfiles' | 'comunidades' | 'promotores';

interface PreviewTab {
  id: PreviewId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const PREVIEWS: PreviewTab[] = [
  {
    id: 'novedades',
    label: 'Novedades',
    eyebrow: 'Todo lo que pasa',
    title: 'Tu comunidad, al día.',
    description: 'Compartí proyectos, búsquedas y recursos con toda la comunidad.',
    icon: Newspaper,
  },
  {
    id: 'pasantias',
    label: 'Buscar',
    eyebrow: 'Descubrí oportunidades',
    title: 'Lo que encaja con vos, primero.',
    description:
      'Explorá búsquedas verificadas, filtrá por área y guardá las que te interesan.',
    icon: LayoutGrid,
  },
  {
    id: 'perfiles',
    label: 'Perfiles',
    eyebrow: 'Explorá talento',
    title: 'Personas reales, conexiones reales.',
    description: 'Encontrá estudiantes, empresas y embajadores dentro de PasantIA.',
    icon: Compass,
  },
  {
    id: 'comunidades',
    label: 'Comunidades',
    eyebrow: 'Tu espacio compartido',
    title: 'Creá y encontrá tu comunidad.',
    description: 'Unite por universidad, carrera o intereses y compartí oportunidades.',
    icon: Users,
  },
  {
    id: 'promotores',
    label: 'Promotores',
    eyebrow: 'Hacé crecer la red',
    title: 'Sumá personas. Subí en el ranking.',
    description: 'Invitá estudiantes, empresas y comunidades y ganá reconocimiento.',
    icon: Rocket,
  },
];

function AppTopbar() {
  return (
    <div className="flex h-9 items-center gap-2 border-b border-slate-200 bg-white px-2.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand-500 text-[9px] font-black text-white">P</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[7px] text-slate-400">
        <Search size={9} /> Buscar perfiles...
      </div>
      <MessageCircle size={13} className="text-slate-600" />
      <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-50 text-[6px] font-bold text-slate-800">AX</span>
    </div>
  );
}

function InternshipScreen() {
  return (
    <div className="bg-[#eef1f5] px-3 py-3 text-slate-800">
      <div className="flex items-start justify-between">
        <div><p className="text-[7px] text-slate-400">Hola, Axus</p><h4 className="text-[13px] font-bold">Buscar pasantías</h4><p className="mt-1 text-[7px] text-slate-400">Explorá las oportunidades activas y postulate en un clic.</p></div>
        <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white"><Heart size={11} className="text-slate-500" /></span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-2 py-2 text-[7px] text-slate-400"><Search size={10} />Buscar por título, proyecto, área o empresa</div>
      <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-300 bg-slate-100 px-2 py-2 text-[7px] text-slate-600">Toda modalidad<ChevronDown size={9} /></div>
      <article className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <img src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=75" alt="Código en una pantalla" className="h-20 w-full object-cover" />
        <div className="p-2.5">
          <div className="flex items-center justify-between text-[7px] text-slate-500"><span className="flex items-center gap-1"><Building2 size={9} />TechNova (DEMO)</span><span className="flex gap-1"><Heart size={9} /><Flag size={9} /></span></div>
          <h5 className="mt-2 text-[10px] font-bold">Pasantía en Desarrollo Frontend (DEMO)</h5>
          <div className="mt-1.5 flex gap-1 text-[6px] text-slate-500"><span className="rounded-full border bg-slate-50 px-2 py-0.5">Tecnología</span><span className="rounded-full border bg-slate-50 px-2 py-0.5">Híbrido</span><span className="flex items-center gap-0.5 rounded-full border bg-slate-50 px-2 py-0.5"><MapPin size={6} />Buenos Aires</span></div>
          <p className="mt-2 line-clamp-2 text-[7px] leading-relaxed text-slate-500">Pasantía DEMO de ejemplo. Sumate a nuestro equipo para construir interfaces con React y TypeScript.</p>
          <div className="mt-2 flex gap-1.5"><button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[7px] font-bold">Postularme</button><button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[7px]">Ver detalle</button></div>
          <div className="mt-2 flex justify-end gap-3 border-t pt-2 text-[7px] text-slate-500"><span>Reaccionar</span><span className="flex items-center gap-1"><MessageCircle size={8} />Comentar</span></div>
        </div>
      </article>
    </div>
  );
}

function NewsScreen() {
  return (
    <div className="bg-[#eef1f5] px-3 py-3 text-slate-800">
      <h4 className="text-[13px] font-bold">Novedades</h4><p className="mt-1 text-[7px] text-slate-400">Compartí proyectos, búsquedas y recursos con la comunidad de PasantIA.</p>
      <button className="mt-2 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[7px] font-bold shadow-sm"><Plus size={9} />Publicar</button>
      <div className="mt-2 flex items-center justify-between rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-[7px]">Categoría: Todas<ChevronDown size={9} /></div>
      <article className="mt-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="flex justify-between"><span className="rounded-full border bg-slate-50 px-2 py-0.5 text-[6px]">Proyecto</span><Trash2 size={9} className="text-slate-400" /></div>
        <h5 className="mt-2 text-[10px] font-bold">Nueva plataforma web!</h5><p className="mt-1 text-[7px] text-slate-500">Comparto la web que vengo creando hace unas semanas!</p>
        <div className="mt-2 rounded-lg border bg-slate-50 p-2"><p className="text-[6px] text-slate-400">COMARH.COM.AR</p><p className="truncate text-[7px]">https://www.comarh.com.ar/</p></div>
        <div className="mt-2 flex items-center justify-between border-t pt-2 text-[6px] text-slate-500"><span className="flex items-center gap-1"><GraduationCap size={8} />Axus Analytics · 5/8/2026</span></div>
        <div className="mt-2 flex justify-end gap-3 border-t pt-2 text-[7px] text-slate-500"><span>Reaccionar</span><span className="flex items-center gap-1"><MessageCircle size={8} />Comentar</span></div>
      </article>
      <article className="mt-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"><span className="rounded-full border bg-slate-50 px-2 py-0.5 text-[6px]">Búsqueda</span><h5 className="mt-2 text-[10px] font-bold">[DEMO] Abrimos búsqueda de pasantes</h5><p className="mt-1 line-clamp-3 text-[7px] leading-relaxed text-slate-500">Estamos buscando estudiantes de sistemas para sumarse a nuestro equipo de frontend.</p><div className="mt-2 flex justify-between border-t pt-2 text-[6px] text-slate-500"><span className="flex items-center gap-1"><Building2 size={8} />TechNova (DEMO)</span><span className="flex items-center gap-1 rounded-full border px-2 py-0.5"><Mail size={7} />Contactar</span></div></article>
    </div>
  );
}

function CommunitiesScreen() {
  return (
    <div className="bg-[#eef1f5] px-3 py-3 text-slate-800"><h4 className="text-[13px] font-bold">Mis comunidades</h4><p className="mt-1 text-[7px] text-slate-400">Creá comunidades de estudiantes y compartí el link con tus compañeros.</p><button className="mt-2 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[7px] font-bold"><Plus size={9} />Nueva comunidad</button>
      {[['SU','Comunidad Sistemas UBA (DEMO)','24 miembros'],['IU','Ingeniería Industrial UTN (DEMO)','15 miembros']].map(([initials,name,members], index) => <article key={name} className="mt-2.5 rounded-xl border bg-white p-2.5 shadow-sm"><div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center rounded-full text-[8px] font-bold text-white ${index ? 'bg-red-500' : 'bg-blue-500'}`}>{initials}</span><h5 className="flex-1 text-[9px] font-bold">{name}</h5><ExternalLink size={9} className="text-brand-500" /></div><p className="mt-2 line-clamp-2 text-[7px] leading-relaxed text-slate-500">Comunidad DEMO de ejemplo. Estudiantes compartiendo pasantías, recursos y experiencias.</p><div className="mt-2 flex justify-between border-t pt-1.5 text-[6px] text-slate-400"><span>{members}</span><span>Pública</span></div><button className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-full border bg-slate-50 py-1 text-[7px]"><Copy size={8} />Copiar link</button></article>)}
      <h5 className="mt-3 text-[10px] font-bold">Descubrir comunidades</h5><article className="mt-2 rounded-xl border bg-white p-2.5"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-violet-500 text-[8px] font-bold text-white">UA</span><h5 className="text-[9px] font-bold">Diseño & UX Argentina</h5></div><p className="mt-2 text-[7px] text-slate-500">Comunidad de diseñadores junior buscando su primera experiencia.</p><button className="mt-2 w-full rounded-full bg-brand-500 py-1 text-[7px] font-bold text-white">Unirme</button></article>
    </div>
  );
}

function ProfilesScreen() {
  const people = [
    ['AA', 'Abril Álvarez', 'Lic. Dirección de negocios · 2º año · UCES', 'Excel · comunicación'],
    ['VO', 'Virginia Oggero', 'Ingeniería en alimentos · 3º año · UNL', 'trabajo en equipo'],
    ['MF', 'Marcos Filomena', 'Ingeniería Industrial · 1º año · UNL', 'Excel · Análisis de datos'],
    ['AB', 'Alejo Baldi', 'Ingeniería Industrial · 5º año · UTN', 'Excel · Lean'],
    ['FB', 'Franco Bustos', 'Ingeniería en Informática · 4º año · UBA', 'JavaScript · Python · SQL'],
  ];
  return (
    <div className="space-y-2 bg-[#eef1f5] px-3 py-3 text-slate-800"><h4 className="text-[13px] font-bold">Explorar perfiles</h4><div className="flex gap-1 text-[6px]"><span className="rounded-full bg-brand-500 px-2 py-1 text-white">Estudiantes</span><span className="rounded-full bg-white px-2 py-1">Empresas</span><span className="rounded-full bg-white px-2 py-1">Embajadores</span></div>{people.map(([initials,name,study,skills], index) => <article key={name} className="rounded-xl border bg-white p-2 shadow-sm"><div className="flex gap-2"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[7px] font-bold ${index % 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{initials}</span><div className="min-w-0"><h5 className="text-[9px] font-bold">{name}</h5><p className="text-[6px] leading-relaxed text-slate-400">{study}</p></div></div><div className="mt-1.5 flex gap-1">{skills.split(' · ').map((skill) => <span key={skill} className="rounded-full border bg-slate-50 px-2 py-0.5 text-[6px] text-slate-500">{skill}</span>)}</div><p className="mt-1 text-[6px] text-slate-400">Ver perfil →</p></article>)}
    </div>
  );
}

function PromotersScreen() {
  const ranking = [['Alejo Baldi','10'],['Sofía Gómez','5'],['Mateo Fernández','4'],['Geronimo re','3']];
  return <div className="bg-[#eef1f5] px-3 py-3 text-slate-800"><div className="flex justify-between"><div><h4 className="text-[13px] font-bold">Promotores</h4><p className="mt-1 text-[7px] text-slate-400">Ayudanos a construir PasantIA. Mirá quiénes están sumando gente.</p></div><span className="grid h-6 w-6 place-items-center rounded-full border"><Info size={10} /></span></div><article className="mt-3 rounded-xl border bg-white p-3 text-center"><span className="mx-auto grid h-8 w-8 place-items-center rounded-lg border bg-slate-50"><Send size={14} /></span><h5 className="mt-2 text-[10px] font-bold">¿Querés ser promotor/a?</h5><p className="mt-1 text-[7px] leading-relaxed text-slate-400">Sumate a construir PasantIA. Te asignamos un enlace personal para invitar.</p><button className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-[7px] font-bold text-white"><Send size={8} />Solicitar ser promotor</button></article><h5 className="mt-3 flex items-center gap-1 text-[10px] font-bold"><Trophy size={11} />Ranking de promotores</h5><div className="mt-2 space-y-1.5">{ranking.map(([name,total], index) => <div key={name} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 p-2"><span className="grid h-7 w-7 place-items-center rounded-lg border text-[7px] font-bold">{index+1}</span><div className="flex-1"><p className="text-[8px] font-bold">{name}</p><p className="mt-1 text-[5px] text-slate-400">estudiantes · empresas · comunidades</p></div><div className="text-center"><p className="text-[13px] font-bold">{total}</p><p className="text-[5px] uppercase text-slate-400">sumados</p></div></div>)}</div></div>;
}

const SCREENS: Record<PreviewId, ComponentType> = {
  novedades: NewsScreen,
  pasantias: InternshipScreen,
  perfiles: ProfilesScreen,
  comunidades: CommunitiesScreen,
  promotores: PromotersScreen,
};

interface InteractiveAppPreviewProps {
  variant?: 'section' | 'hero';
}

export function InteractiveAppPreview({ variant = 'section' }: InteractiveAppPreviewProps) {
  const [activeId, setActiveId] = useState<PreviewId>('pasantias');
  const activeIndex = PREVIEWS.findIndex((preview) => preview.id === activeId);
  const active = PREVIEWS[activeIndex];
  const Screen = SCREENS[activeId];

  if (variant === 'hero') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <div className="relative w-[13.5rem] rounded-[2.65rem] border border-white/30 bg-slate-950 p-[6px] shadow-[0_32px_70px_rgba(1,19,84,0.5)] xs:w-[15rem] md:w-[14rem] lg:w-[14.5rem] xl:w-[17rem]">
          <div className="absolute left-1/2 top-[11px] z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-950" />
          <div className="relative aspect-[9/19.1] overflow-hidden rounded-[2.3rem] bg-[#f8fafc]">
            <div className="flex h-8 items-center justify-between px-5 pt-1 text-[7px] font-bold text-slate-800">
              <span>9:41</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm border border-slate-700" /><span className="h-1.5 w-1.5 rounded-full bg-slate-700" /></span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={activeId} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.24 }} className="absolute inset-x-0 bottom-[3.7rem] top-8 origin-top scale-[0.88] overflow-hidden xs:scale-95 md:scale-100">
                <AppTopbar />
                <Screen />
              </motion.div>
            </AnimatePresence>
            <nav aria-label="Navegación de la vista previa" className="absolute inset-x-0 bottom-0 z-20 grid h-[3.7rem] grid-cols-5 border-t border-slate-200 bg-white px-1 pt-2">
              {PREVIEWS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveId(id)} aria-pressed={activeId === id} className={`flex min-w-0 flex-col items-center gap-1 text-[6px] font-semibold transition-colors ${activeId === id ? 'text-brand-500' : 'text-slate-400'}`}>
                  <Icon size={15} strokeWidth={activeId === id ? 2.5 : 2} />
                  <span className="max-w-full truncate">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="mt-4 hidden w-full grid-cols-5 gap-2 md:grid">
          {PREVIEWS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveId(id)} aria-pressed={activeId === id} className={`flex min-w-0 flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-[7px] font-semibold transition-colors md:text-[8px] ${activeId === id ? 'border-white/35 bg-white text-brand-600' : 'border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={12} />
              <span className="max-w-full truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/15" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300/25 blur-3xl" />
      <div className="container-px relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">La plataforma, en tus manos</span>
          <h2 className="mt-5 text-4xl font-semibold tracking-tighter sm:text-6xl">Tocá. Explorá. <span className="font-light text-white/65">Así se siente PasantIA.</span></h2>
          <p className="mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-white/65 sm:text-lg">Una sola app para descubrir oportunidades, seguir tus procesos y construir tu red.</p>
        </Reveal>

        <div className="mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-[1fr_23rem_1fr] lg:gap-12">
          <div className="order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div key={active.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.28 }} className="mx-auto max-w-md text-center lg:mx-0 lg:text-left">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{active.eyebrow}</span>
                <h3 className="mt-3 text-3xl font-semibold tracking-tighter sm:text-4xl">{active.title}</h3>
                <p className="mt-4 text-base font-light leading-relaxed text-white/65">{active.description}</p>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/45 lg:justify-start"><span className="font-semibold text-white">0{activeIndex + 1}</span><span className="h-px w-12 bg-white/25" /><span>0{PREVIEWS.length}</span></div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="order-1 mx-auto lg:order-2">
            <div className="relative w-[18.25rem] rounded-[3.2rem] border border-white/30 bg-slate-950 p-[7px] shadow-[0_40px_90px_rgba(1,19,84,0.55)] sm:w-[20rem]">
              <div className="absolute left-1/2 top-[13px] z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
              <div className="relative aspect-[9/19.1] overflow-hidden rounded-[2.75rem] bg-[#f8fafc]">
                <div className="flex h-9 items-center justify-between px-6 pt-1 text-[8px] font-bold text-slate-800"><span>9:41</span><span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm border border-slate-700" /><span className="h-1.5 w-1.5 rounded-full bg-slate-700" /></span></div>
                <AnimatePresence mode="wait">
                  <motion.div key={activeId} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.24 }} className="absolute inset-x-0 bottom-[4.15rem] top-9 overflow-hidden">
                    <AppTopbar />
                    <Screen />
                  </motion.div>
                </AnimatePresence>
                <nav aria-label="Navegación de la vista previa" className="absolute inset-x-0 bottom-0 z-20 grid h-[4.15rem] grid-cols-5 border-t border-slate-200 bg-white px-1 pt-2">
                  {PREVIEWS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveId(id)} aria-pressed={activeId === id} className={`flex min-w-0 flex-col items-center gap-1 text-[7px] font-semibold transition-colors ${activeId === id ? 'text-brand-500' : 'text-slate-400'}`}>
                      <Icon size={17} strokeWidth={activeId === id ? 2.5 : 2} />
                      <span className="max-w-full truncate">{label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="order-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {PREVIEWS.map(({ id, label, icon: Icon }, index) => (
              <button key={id} onClick={() => setActiveId(id)} aria-pressed={activeId === id} className={`group flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors sm:px-4 ${activeId === id ? 'border-white/35 bg-white text-brand-600' : 'border-white/12 bg-white/[0.04] text-white/65 hover:bg-white/[0.09] hover:text-white'}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${activeId === id ? 'bg-brand-50' : 'bg-white/10'}`}><Icon size={16} /></span>
                <span className="min-w-0"><span className="block text-[9px] font-bold opacity-50">0{index + 1}</span><span className="block truncate text-xs font-semibold sm:text-sm">{label}</span></span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-8 text-center text-[11px] text-white/40"><Clock3 size={12} className="mr-1 inline" />Vista interactiva del producto</p>
      </div>
    </section>
  );
}