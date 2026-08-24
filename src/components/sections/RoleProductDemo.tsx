import { useState, type ComponentType } from 'react';
import {
  Bell,
  Briefcase,
  CheckCircle2,
  Compass,
  FileText,
  House,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Newspaper,
  Search,
  Send,
  Trophy,
  UserRound,
  Users,
  Rocket,
} from 'lucide-react';
import { Section } from '../ui/Section';
import { Reveal } from '../ui/Reveal';
import { Accent } from '../ui/Accent';
import avatarStudent from '../../assets/images/mockup/abril.webp';
import avatarCandidate from '../../assets/images/mockup/virginia.webp';
import avatarCommunity from '../../assets/images/mockup/comunidad-sistemas.webp';
import internshipImage from '../../assets/images/mockup/internship.webp';

type Role = 'estudiante' | 'empresa' | 'embajador';

interface DemoView {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const ROLE_COPY: Record<Role, { eyebrow: string; title: string; description: string; views: DemoView[] }> = {
  estudiante: {
    eyebrow: 'Vista estudiante',
    title: 'Probá tu experiencia antes de entrar.',
    description: 'Explorá el perfil, las pasantías y el seguimiento de postulaciones en celular o computadora.',
    views: [
      { id: 'novedades', label: 'Novedades', icon: Newspaper },
      { id: 'buscar', label: 'Buscar pasantías', icon: Briefcase },
      { id: 'explorar', label: 'Explorar perfiles', icon: Compass },
      { id: 'comunidades', label: 'Mis comunidades', icon: Users },
      { id: 'promotores', label: 'Promotores', icon: Rocket },
      { id: 'postulaciones', label: 'Mis postulaciones', icon: Send },
      { id: 'perfil', label: 'Mi perfil', icon: UserRound },
    ],
  },
  empresa: {
    eyebrow: 'Vista empresa',
    title: 'Gestioná talento desde un solo lugar.',
    description: 'Mirá cómo se publica una búsqueda, se comparan candidatos y se organiza el proceso.',
    views: [
      { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
      { id: 'pasantias', label: 'Mis pasantías', icon: Briefcase },
      { id: 'candidatos', label: 'Postulaciones', icon: Users },
      { id: 'talento', label: 'Explorar talentos', icon: Compass },
      { id: 'novedades', label: 'Novedades', icon: Newspaper },
      { id: 'perfil', label: 'Perfil de empresa', icon: UserRound },
    ],
  },
  embajador: {
    eyebrow: 'Vista embajador',
    title: 'Difundí, medí y compartí el impacto.',
    description: 'Probá el panel de comunidad, los anuncios para difundir y el ranking de embajadores.',
    views: [
      { id: 'panel', label: 'Mi panel', icon: LayoutDashboard },
      { id: 'inicio', label: 'Inicio', icon: House },
      { id: 'anuncios', label: 'Anuncios', icon: Megaphone },
      { id: 'ranking', label: 'Ranking', icon: Trophy },
      { id: 'explorar', label: 'Explorar perfiles', icon: Compass },
      { id: 'comunidad', label: 'Mi comunidad', icon: UserRound },
    ],
  },
};

function Topbar({ role }: { role: Role }) {
  const name = role === 'empresa' ? 'Nexo Labs' : role === 'embajador' ? 'Comunidad UTN' : 'Abril Álvarez';
  const avatar = role === 'embajador' ? avatarCommunity : role === 'empresa' ? undefined : avatarStudent;
  return (
    <div className="flex h-11 items-center gap-2 border-b border-slate-200 bg-white px-3 text-slate-800">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-500 text-[10px] font-black text-white">P</span>
      <span className="hidden text-[9px] font-bold sm:block">asantIA</span>
      <div className="ml-1 hidden min-w-0 max-w-44 flex-1 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 text-[7px] text-slate-400 sm:flex">
        <Search className="h-3 w-3" /> Buscar perfiles…
      </div>
      <div className="ml-auto flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
        <Bell className="h-3.5 w-3.5 text-slate-500" />
        {avatar ? (
          <img src={avatar} alt={name} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-[7px] font-bold text-white">NL</span>
        )}
      </div>
    </div>
  );
}

function DemoNavigation({
  views,
  active,
  onChange,
  mobile = false,
}: {
  views: DemoView[];
  active: string;
  onChange: (id: string) => void;
  mobile?: boolean;
}) {
  return (
    <nav className={mobile ? 'absolute inset-x-0 bottom-0 z-10 flex items-start border-t border-slate-200 bg-white px-0.5 py-2' : 'flex h-12 items-stretch justify-center border-b border-slate-200 bg-white'}>
      {views.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={
            mobile
              ? `flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 text-[5px] font-semibold ${active === id ? 'text-brand-600' : 'text-slate-400'}`
              : `flex items-center gap-1.5 border-b-2 px-3 text-[9px] font-semibold ${active === id ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'}`
          }
        >
          <Icon className={mobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          <span className="max-w-full truncate">{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <p className="text-base font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[8px] text-slate-500">{label}</p>
    </div>
  );
}

function NewsDemo({ role }: { role: Role }) {
  const author = role === 'empresa' ? 'Nexo Labs' : role === 'embajador' ? 'Comunidad UTN' : 'Abril Álvarez';
  const avatar = role === 'embajador' ? avatarCommunity : role === 'empresa' ? undefined : avatarStudent;
  const isCommunityHome = role === 'embajador';
  return (
    <div>
      <div className="flex items-center justify-between"><div><h4 className="text-sm font-bold">{isCommunityHome ? 'Inicio' : 'Novedades'}</h4><p className="text-[8px] text-slate-500">{isCommunityHome ? 'Actividad reciente de PasantIA.' : 'Proyectos, búsquedas y recursos de la comunidad.'}</p></div><button className="rounded-full bg-brand-500 px-3 py-1.5 text-[8px] font-bold text-white">Publicar</button></div>
      <article className="mt-4 rounded-xl border bg-white p-3">
        <div className="flex items-center gap-2">{avatar ? <img src={avatar} alt={author} className="h-8 w-8 rounded-full object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-[7px] font-bold text-white">NL</span>}<div><p className="text-[9px] font-bold">{author}</p><p className="text-[7px] text-slate-400">Proyecto · hoy</p></div></div>
        <h5 className="mt-3 text-[11px] font-bold">Nueva iniciativa para estudiantes</h5><p className="mt-1 text-[8px] leading-relaxed text-slate-500">Compartimos una oportunidad y recursos para preparar tu próxima postulación.</p>
        <div className="mt-3 flex justify-end gap-4 border-t pt-2 text-[8px] text-slate-500"><span>Reaccionar</span><span>Comentar</span></div>
      </article>
    </div>
  );
}

function ExploreDemo({ title = 'Explorar perfiles' }: { title?: string }) {
  const rows = [[avatarStudent, 'Abril Álvarez', 'Dirección de Negocios · UCES'], [avatarCandidate, 'Virginia Oggero', 'Ingeniería en Alimentos · UNL']];
  return <div><h4 className="text-sm font-bold">{title}</h4><div className="mt-3 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[8px] text-slate-400"><Search className="h-3 w-3" />Buscar por nombre, carrera o área</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{rows.map(([avatar,name,detail]) => <div key={name} className="rounded-xl border bg-white p-3"><div className="flex items-center gap-2"><img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" /><div><p className="text-[9px] font-bold">{name}</p><p className="text-[7px] text-slate-400">{detail}</p></div></div><div className="mt-3 flex gap-1"><button className="rounded-full bg-brand-500 px-3 py-1 text-[7px] font-bold text-white">Ver perfil</button><button className="rounded-full border px-3 py-1 text-[7px]">Mensaje</button></div></div>)}</div></div>;
}

function CommunitiesDemo() {
  return <div><div className="flex items-center justify-between"><div><h4 className="text-sm font-bold">Mis comunidades</h4><p className="text-[8px] text-slate-500">Compartí oportunidades con tus compañeros.</p></div><button className="rounded-full bg-brand-500 px-3 py-1.5 text-[8px] font-bold text-white">Nueva comunidad</button></div><div className="mt-4 space-y-2">{[[avatarCommunity,'Comunidad Sistemas UBA','24 miembros'],[avatarCandidate,'Diseño & UX Argentina','31 miembros']].map(([avatar,name,members]) => <div key={name} className="flex items-center gap-3 rounded-xl border bg-white p-3"><img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-bold">{name}</p><p className="text-[7px] text-slate-400">{members}</p></div><button className="rounded-lg border px-2 py-1 text-[7px]">Abrir</button></div>)}</div></div>;
}

function PromotersDemo() {
  return <div><h4 className="text-sm font-bold">Ranking de promotores</h4><p className="mt-1 text-[8px] text-slate-500">Invitá personas con tu enlace y subí posiciones.</p><div className="mt-3 rounded-lg border bg-white p-2 text-[8px] text-slate-500">pasantia.com/?ref=abril <button className="float-right font-bold text-brand-600">Copiar</button></div><div className="mt-3 space-y-2">{[[avatarStudent,'Abril Álvarez','10'],[avatarCandidate,'Sofía Gómez','7'],[avatarCommunity,'Gerónimo Rey','4']].map(([avatar,name,total],index)=><div key={name} className="flex items-center gap-2 rounded-xl border bg-white p-2.5"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-[8px] font-bold text-brand-600">{index+1}</span><img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover" /><p className="min-w-0 flex-1 truncate text-[9px] font-bold">{name}</p><p className="text-[12px] font-bold">{total}</p></div>)}</div></div>;
}

function CompanyInternshipsDemo() {
  return <div><div className="flex items-center justify-between"><div><h4 className="text-sm font-bold">Mis pasantías</h4><p className="text-[8px] text-slate-500">Administrá búsquedas activas y candidatos.</p></div><button className="rounded-full bg-brand-500 px-3 py-1.5 text-[8px] font-bold text-white">Publicar pasantía</button></div><div className="mt-4 space-y-2">{[['Desarrollo Frontend','12 postulantes','Activa'],['Analista Comercial','8 postulantes','Activa']].map(([title,count,status])=><div key={title} className="flex items-center gap-3 rounded-xl border bg-white p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><Briefcase className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold">{title}</p><p className="text-[7px] text-slate-400">{count}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[7px] font-semibold text-emerald-700">{status}</span></div>)}</div></div>;
}

function ProfileDemo({ role }: { role: Role }) {
  const community = role === 'embajador';
  const company = role === 'empresa';
  const name = community ? 'Comunidad UTN' : company ? 'Nexo Labs' : 'Abril Álvarez';
  const avatar = community ? avatarCommunity : avatarStudent;
  return <div><p className="text-[8px] text-slate-400">{community ? 'MI COMUNIDAD' : company ? 'PERFIL DE EMPRESA' : 'MI PERFIL'}</p><div className="mt-3 flex items-center gap-3"><img src={avatar} alt={name} className="h-14 w-14 rounded-full object-cover" /><div><h4 className="text-sm font-bold">{name}</h4><p className="text-[8px] text-slate-500">{community ? 'Comunidad universitaria · Verificada' : company ? 'Tecnología · 51–200 personas' : 'Dirección de Negocios · UCES'}</p></div><button className="ml-auto rounded-lg border px-2 py-1 text-[7px] font-semibold">Editar perfil</button></div><div className="mt-4 rounded-xl border bg-white p-3"><p className="text-[9px] font-bold">{company ? 'Sobre la empresa' : community ? 'Descripción' : 'Sobre mí'}</p><p className="mt-1 text-[8px] leading-relaxed text-slate-500">{company ? 'Creamos productos digitales y buscamos talento joven.' : community ? 'Difundimos pasantías y recursos para estudiantes.' : 'Interesada en estrategia, análisis y nuevos negocios.'}</p></div></div>;
}

function StudentScreen({ view }: { view: string }) {
  if (view === 'novedades') return <NewsDemo role="estudiante" />;
  if (view === 'explorar') return <ExploreDemo />;
  if (view === 'comunidades') return <CommunitiesDemo />;
  if (view === 'promotores') return <PromotersDemo />;
  if (view === 'perfil') {
    return (
      <div>
        <p className="text-[8px] font-medium text-slate-400">MI PERFIL</p>
        <div className="mt-3 flex items-center gap-3">
          <img src={avatarStudent} alt="Abril Álvarez" className="h-12 w-12 rounded-full object-cover" />
          <div><h4 className="text-sm font-bold">Abril Álvarez</h4><p className="text-[9px] text-slate-500">Dirección de Negocios · UCES</p></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2"><Metric value="85%" label="Perfil completo" /><Metric value="4" label="Postulaciones" /><Metric value="12" label="Conexiones" /></div>
        <div className="mt-4 rounded-xl border bg-white p-3"><p className="text-[9px] font-bold">Sobre mí</p><p className="mt-1 text-[8px] leading-relaxed text-slate-500">Estudiante interesada en estrategia, análisis y nuevos negocios.</p><div className="mt-3 flex gap-1"><span className="rounded-full bg-slate-100 px-2 py-1 text-[7px]">Excel</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[7px]">Comunicación</span></div></div>
      </div>
    );
  }
  if (view === 'postulaciones') {
    return (
      <div><h4 className="text-sm font-bold">Mis postulaciones</h4><p className="mt-1 text-[8px] text-slate-500">Estado actualizado por la empresa.</p><div className="mt-4 space-y-2">{[['Analista Comercial Jr.','En revisión'],['Marketing Digital','Entrevista'],['Operaciones','Pendiente']].map(([title,status], index) => <div key={title} className="flex items-center gap-3 rounded-xl border bg-white p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-bold">{title}</p><p className="text-[7px] text-slate-400">Nexo Labs</p></div><span className={`rounded-full px-2 py-1 text-[7px] font-semibold ${index === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{status}</span></div>)}</div></div>
    );
  }
  return (
    <div><h4 className="text-sm font-bold">Pasantías para vos</h4><p className="mt-1 text-[8px] text-slate-500">Oportunidades que coinciden con tu perfil.</p><article className="mt-3 overflow-hidden rounded-xl border bg-white"><img src={internshipImage} alt="Pasantía frontend" className="h-24 w-full object-cover" /><div className="p-3"><p className="text-[8px] text-slate-500">Nexo Labs</p><h5 className="mt-1 text-[11px] font-bold">Pasantía en Desarrollo Frontend</h5><div className="mt-2 flex gap-1 text-[7px]"><span className="rounded-full bg-slate-100 px-2 py-1">Híbrido</span><span className="rounded-full bg-slate-100 px-2 py-1">Tecnología</span></div><button className="mt-3 rounded-full bg-brand-500 px-4 py-1.5 text-[8px] font-bold text-white">Postularme</button></div></article></div>
  );
}

function CompanyScreen({ view }: { view: string }) {
  if (view === 'pasantias') return <CompanyInternshipsDemo />;
  if (view === 'talento') return <ExploreDemo title="Explorar talentos" />;
  if (view === 'novedades') return <NewsDemo role="empresa" />;
  if (view === 'perfil') return <ProfileDemo role="empresa" />;
  if (view === 'candidatos') {
    return <div><h4 className="text-sm font-bold">Postulaciones recibidas</h4><p className="mt-1 text-[8px] text-slate-500">Compará perfiles y actualizá cada estado.</p><div className="mt-4 space-y-2">{[[avatarStudent,'Abril Álvarez','Dirección de Negocios','Nuevo'],[avatarCandidate,'Virginia Oggero','Ingeniería en Alimentos','Entrevista']].map(([avatar,name,career,status]) => <div key={name} className="flex items-center gap-3 rounded-xl border bg-white p-3"><img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold">{name}</p><p className="truncate text-[8px] text-slate-500">{career}</p></div><span className="rounded-lg border px-2 py-1 text-[7px] font-semibold">{status}</span></div>)}</div></div>;
  }
  return <div><p className="text-[8px] text-slate-400">PANEL DE EMPRESA</p><h4 className="mt-1 text-sm font-bold">Hola, Nexo Labs</h4><div className="mt-4 grid grid-cols-3 gap-2"><Metric value="3" label="Pasantías activas" /><Metric value="28" label="Postulaciones" /><Metric value="6" label="En entrevista" /></div><div className="mt-4 rounded-xl border bg-white p-3"><p className="text-[9px] font-bold">Resumen de postulaciones</p><div className="mt-3 grid grid-cols-4 items-end gap-2">{[35,70,48,88].map((height,index)=><div key={index} className="rounded-t bg-brand-500/70" style={{height}} />)}</div></div></div>;
}

function AmbassadorScreen({ view }: { view: string }) {
  if (view === 'explorar') return <ExploreDemo />;
  if (view === 'inicio') return <NewsDemo role="embajador" />;
  if (view === 'comunidad') return <ProfileDemo role="embajador" />;
  if (view === 'anuncios') {
    return <div><h4 className="text-sm font-bold">Anuncios para difundir</h4><article className="mt-3 overflow-hidden rounded-xl border bg-white"><img src={internshipImage} alt="Anuncio de pasantía" className="h-24 w-full object-cover" /><div className="p-3"><p className="text-[8px] text-slate-500">Nexo Labs</p><h5 className="text-[11px] font-bold">Pasantía Frontend</h5><button className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-[8px] font-bold text-white"><Megaphone className="h-3 w-3" />Marcar difundida</button></div></article></div>;
  }
  if (view === 'ranking') {
    return <div><h4 className="text-sm font-bold">Ranking de comunidades</h4><div className="mt-4 space-y-2">{[[avatarCommunity,'Comunidad UTN','120'],[avatarStudent,'Centro de Estudiantes','90'],[avatarCandidate,'Empleo UCA','70']].map(([avatar,name,points], index) => <div key={name} className="flex items-center gap-3 rounded-xl border bg-white p-2.5"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-[8px] font-bold text-brand-600">{index + 1}</span><img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover" /><p className="min-w-0 flex-1 truncate text-[9px] font-bold">{name}</p><p className="text-[11px] font-bold">{points}</p></div>)}</div></div>;
  }
  return <div><div className="flex items-center gap-3"><img src={avatarCommunity} alt="Comunidad UTN" className="h-12 w-12 rounded-full object-cover" /><div><p className="text-[8px] text-slate-400">MI COMUNIDAD</p><h4 className="text-sm font-bold">Comunidad UTN</h4></div></div><div className="mt-4 grid grid-cols-3 gap-2"><Metric value="120" label="Puntos" /><Metric value="12" label="Difusiones" /><Metric value="#1" label="Ranking" /></div><div className="mt-4 rounded-xl bg-slate-900 p-4 text-white"><p className="text-[8px] text-white/60">Nivel actual</p><p className="mt-1 text-sm font-bold">Embajador Plata</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full w-3/4 rounded-full bg-brand-400" /></div></div></div>;
}

function RoleScreen({ role, view }: { role: Role; view: string }) {
  if (role === 'empresa') return <CompanyScreen view={view} />;
  if (role === 'embajador') return <AmbassadorScreen view={view} />;
  return <StudentScreen view={view} />;
}

export function RoleProductDemo({ role }: { role: Role }) {
  const copy = ROLE_COPY[role];
  const [view, setView] = useState(copy.views[0].id);

  return (
    <Section id="demo-plataforma" className="scroll-mt-24 bg-brand-950/30">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{copy.eyebrow}</span>
        <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">La plataforma, <Accent>desde tu lado.</Accent></h2>
        <p className="mx-auto mt-4 max-w-2xl text-base font-light text-white/65 sm:text-lg">{copy.description}</p>
      </Reveal>

      <div className="mt-9 flex items-center justify-center gap-8 overflow-hidden lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:overflow-visible">
        <div aria-label="Mockup móvil de PasantIA" className="w-[17rem] rounded-[2.7rem] border border-white/30 bg-slate-950 p-1.5 shadow-2xl shadow-brand-950/60">
          <div className="relative aspect-[9/18.6] overflow-hidden rounded-[2.35rem] bg-[#eef1f5]">
            <div className="flex h-7 items-center justify-between px-5 text-[7px] font-bold text-slate-800"><span>9:41</span><span>● ●</span></div>
            <Topbar role={role} />
            <div className="p-3 pb-16 text-slate-800"><RoleScreen role={role} view={view} /></div>
            <DemoNavigation views={copy.views} active={view} onChange={setView} mobile />
          </div>
        </div>

        <div aria-label="Mockup de escritorio de PasantIA" className="hidden w-full max-w-4xl lg:block">
          <div className="overflow-hidden rounded-2xl border-[6px] border-slate-950 bg-[#eef1f5] shadow-2xl shadow-brand-950/60">
            <Topbar role={role} />
            <DemoNavigation views={copy.views} active={view} onChange={setView} />
            <main className="min-h-[22rem] p-6 text-slate-800"><RoleScreen role={role} view={view} /></main>
          </div>
          <div className="mx-auto h-5 w-1/3 bg-slate-800 [clip-path:polygon(44%_0,56%_0,65%_100%,35%_100%)]" /><div className="mx-auto h-2 w-1/2 rounded-full bg-slate-950" />
        </div>
      </div>
      <p className="mt-5 text-center text-xs text-white/40"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Tocá la navegación del mockup para probar cada sección.</p>
    </Section>
  );
}
