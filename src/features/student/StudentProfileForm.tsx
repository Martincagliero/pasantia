// Estudiante: edita su perfil (nombre + datos académicos, links y CV).
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { UploadCloud, FileText, Loader2, Plus, Check, BriefcaseBusiness, GraduationCap, MapPin, Clock3, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { StudentProfile } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';
import { Card, PageLoader } from '../ui/primitives';
import { AvatarUpload } from '../ui/AvatarUpload';
import { ProfileHeader } from '../ui/ProfileHeader';
import { ProfileCompletion } from '../ui/ProfileCompletion';
import { StudentRecentActivity } from './StudentRecentActivity';
import { UniversityAutocomplete } from '../ui/UniversityAutocomplete';
import { AVAILABILITY_OPTIONS, CAREERS, suggestFor } from './suggestions';
import { detectProfileLink, normalizeProfileUrl, normalizeUrl, profileLinkLabel, type ProfileLinkKind } from '../../lib/url';

const MAX_CV_MB = 20;

export default function StudentProfileForm() {
  const { session, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState<'cv' | 'transcript' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [form, setForm] = useState<Omit<StudentProfile, 'id' | 'skills' | 'verified'> & { skills: string }>({
    avatar_url: '',
    university: '',
    career: '',
    year: '',
    area: '',
    skills: '',
    availability: '',
    bio: '',
    cv_url: '',
    linkedin_url: '',
    portfolio_url: '',
    phone: '',
    location: '',
    gpa: '',
    transcript_url: '',
    github_url: '',
    instagram_url: '',
    is_public: false,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', session!.user.id)
        .single();
      if (!active) return;
      if (data) {
        const s = data as StudentProfile;
        const socialLinks = new Map<ProfileLinkKind, string>();
        ([
          [s.instagram_url, 'instagram'],
          [s.linkedin_url, 'linkedin'],
          [s.github_url, 'github'],
          [s.portfolio_url, 'portfolio'],
        ] as const).forEach(([value, fallbackKind]) => {
          if (!value) return;
          const detected = detectProfileLink(value);
          const kind = detected?.kind === 'portfolio' && !/[./]/.test(value) ? fallbackKind : detected?.kind ?? fallbackKind;
          if (!socialLinks.has(kind)) socialLinks.set(kind, normalizeProfileUrl(value, kind));
        });
        setForm({
          avatar_url: s.avatar_url ?? '',
          university: s.university ?? '',
          career: s.career ?? '',
          year: s.year ?? '',
          area: s.area ?? '',
          skills: (s.skills ?? []).join(', '),
          availability: s.availability ?? '',
          bio: s.bio ?? '',
          cv_url: s.cv_url ?? '',
          linkedin_url: socialLinks.get('linkedin') ?? '',
          portfolio_url: socialLinks.get('portfolio') ?? '',
          phone: s.phone ?? '',
          location: s.location ?? '',
          gpa: s.gpa ?? '',
          transcript_url: s.transcript_url ?? '',
          github_url: socialLinks.get('github') ?? '',
          instagram_url: socialLinks.get('instagram') ?? '',
          is_public: s.is_public ?? false,
        });
      }
      setFullName(profile?.full_name ?? '');
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // Solo recarga si cambia el usuario logueado, NO en cada refresh de token
    // (ej: al volver de otra pestaña), para no pisar cambios sin guardar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  // Sugerencias de áreas y habilidades según la carrera escrita.
  const suggestions = useMemo(() => suggestFor(form.career ?? ''), [form.career]);

  // Habilidades como lista (se guardan como texto separado por comas).
  const skillList = useMemo(
    () => form.skills.split(',').map((s) => s.trim()).filter(Boolean),
    [form.skills]
  );
  const hasSkill = (s: string) =>
    skillList.some((x) => x.toLowerCase() === s.toLowerCase());
  function toggleSkill(skill: string) {
    const next = hasSkill(skill)
      ? skillList.filter((x) => x.toLowerCase() !== skill.toLowerCase())
      : [...skillList, skill];
    set('skills', next.join(', '));
  }

  // Sube un PDF (CV o analítico) a Supabase Storage (bucket 'cvs', carpeta = uid)
  // y guarda su URL pública en la columna correspondiente.
  async function handlePdfUpload(
    e: ChangeEvent<HTMLInputElement>,
    kind: 'cv' | 'transcript'
  ) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-subir el mismo archivo
    if (!file) return;
    setUploadError(null);

    if (file.type !== 'application/pdf') {
      setUploadError('El archivo debe ser un PDF.');
      return;
    }
    if (file.size > MAX_CV_MB * 1024 * 1024) {
      setUploadError(`El archivo supera los ${MAX_CV_MB} MB.`);
      return;
    }

    setUploading(kind);
    const uid = session!.user.id;
    const field = kind === 'cv' ? 'cv_url' : 'transcript_url';
    const path = `${uid}/${kind}.pdf`;
    const { error } = await supabase.storage
      .from('cvs')
      .upload(path, file, { upsert: true, contentType: 'application/pdf' });

    if (error) {
      setUploading(null);
      setUploadError('No se pudo subir el archivo. Verificá que el bucket "cvs" exista.');
      return;
    }

    const { data } = supabase.storage.from('cvs').getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setForm((f) => ({ ...f, [field]: url }));
    await supabase.from('student_profiles').update({ [field]: url }).eq('id', uid);
    setUploading(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!(form.avatar_url ?? '').trim()) {
      alert('Tenés que subir una foto de perfil para guardar tu perfil.');
      const photoSection = document.querySelector<HTMLDetailsElement>('#student-profile-photo');
      if (photoSection) photoSection.open = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    const uid = session!.user.id;
    await Promise.all([
      supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', uid),
      supabase
        .from('student_profiles')
        .update({
          avatar_url: form.avatar_url || null,
          university: form.university || null,
          career: form.career || null,
          year: form.year || null,
          area: form.area || null,
          skills: form.skills
            ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
            : null,
          availability: form.availability || null,
          bio: form.bio || null,
          cv_url: normalizeUrl(form.cv_url ?? '') || null,
          linkedin_url: normalizeProfileUrl(form.linkedin_url ?? '', 'linkedin') || null,
          portfolio_url: normalizeProfileUrl(form.portfolio_url ?? '', 'portfolio') || null,
          phone: form.phone || null,
          location: form.location || null,
          gpa: form.gpa || null,
          transcript_url: form.transcript_url || null,
          github_url: normalizeProfileUrl(form.github_url ?? '', 'github') || null,
          instagram_url: normalizeProfileUrl(form.instagram_url ?? '', 'instagram') || null,
          is_public: form.is_public,
        })
        .eq('id', uid),
    ]);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setEditing(false);
  }

  if (loading) return <PageLoader />;

  if (editing) {
    return (
      <div className="max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
          <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl lg:text-2xl">Editar perfil</h1>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {saved && <span className="text-sm text-emerald-300">Guardado</span>}
            <Button as="button" variant="secondary" size="sm" className="!h-9 !px-3 !text-xs sm:!h-10 sm:!px-5 sm:!text-sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="student-profile-form" variant="primary" size="sm" className="!h-9 !px-3 !text-xs sm:!h-10 sm:!px-5 sm:!text-sm" disabled={saving}>
              {saving ? 'Guardando…' : <><span className="sm:hidden">Guardar</span><span className="hidden sm:inline">Guardar cambios</span></>}
            </Button>
          </div>
        </div>

      <form id="student-profile-form" onSubmit={handleSubmit}>
        <EditSection id="student-profile-photo" title="Foto de perfil" className="mb-4 sm:mb-6">
          <AvatarUpload
            uid={session!.user.id}
            value={form.avatar_url ?? ''}
            onChange={(url) => set('avatar_url', url)}
            hint="Tu cara ayuda a que las empresas te reconozcan. JPG, PNG o WEBP · máx 5 MB."
          />
        </EditSection>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          {/* ── Columna izquierda: datos académicos ── */}
          <EditSection title="Datos académicos">
            <div className="space-y-4 lg:space-y-5">
              <FormRow label="Nombre completo" htmlFor="name">
                <TextField
                  id="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setSaved(false);
                  }}
                  required
                />
              </FormRow>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label="Universidad" htmlFor="uni">
                  <UniversityAutocomplete
                    value={form.university ?? ''}
                    onChange={(v: string) => set('university', v)}
                    placeholder="Busca tu universidad..."
                  />
                </FormRow>
                <FormRow label="Carrera" htmlFor="career">
                  <TextField
                    id="career"
                    list="careers-list"
                    value={form.career ?? ''}
                    onChange={(e) => set('career', e.target.value)}
                    placeholder="Empezá a escribir…"
                  />
                  <datalist id="careers-list">
                    {CAREERS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </FormRow>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label="Año de cursada" htmlFor="year">
                  <SelectField
                    id="year"
                    value={form.year ?? ''}
                    onChange={(e) => set('year', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {['1°', '2°', '3°', '4°', '5°', 'Graduado/a'].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </SelectField>
                </FormRow>
                <FormRow label="Área de interés" htmlFor="area">
                  <TextField
                    id="area"
                    value={form.area ?? ''}
                    onChange={(e) => set('area', e.target.value)}
                    placeholder="Ej: Desarrollo, Marketing, Diseño"
                  />
                </FormRow>
              </div>

              <SuggestChips
                label="Áreas sugeridas para tu carrera"
                items={suggestions.areas}
                isActive={(a) => (form.area ?? '').toLowerCase() === a.toLowerCase()}
                onPick={(a) => set('area', a)}
              />

              <FormRow label="Habilidades" htmlFor="skills">
                <TextField
                  id="skills"
                  value={form.skills}
                  onChange={(e) => set('skills', e.target.value)}
                  placeholder="React, Excel, Inglés (separá con comas)"
                />
              </FormRow>

              <SuggestChips
                label="Habilidades sugeridas (tocá para agregar)"
                items={suggestions.skills}
                isActive={hasSkill}
                onPick={toggleSkill}
              />

              <FormRow label="Disponibilidad" htmlFor="avail">
                <TextField
                  id="avail"
                  value={form.availability ?? ''}
                  onChange={(e) => set('availability', e.target.value)}
                  placeholder="Ej: Medio día, 20 hs semanales"
                />
              </FormRow>

              <SuggestChips
                label="Opciones rápidas"
                items={[...AVAILABILITY_OPTIONS]}
                isActive={(v) => (form.availability ?? '').toLowerCase() === v.toLowerCase()}
                onPick={(v) => set('availability', v)}
              />

              <FormRow label="Sobre mí" htmlFor="bio">
                <TextArea
                  id="bio"
                  value={form.bio ?? ''}
                  onChange={(e) => set('bio', e.target.value)}
                  placeholder="Contá brevemente tu experiencia e intereses."
                />
              </FormRow>
            </div>
          </EditSection>

          {/* ── Columna derecha: contacto, links y archivos ── */}
          <EditSection title="Links y archivos">
            <div className="space-y-4 lg:space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label="Teléfono (opcional)" htmlFor="phone">
                  <TextField
                    id="phone"
                    type="tel"
                    value={form.phone ?? ''}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+54 9 …"
                  />
                </FormRow>
                <FormRow label="Ciudad (opcional)" htmlFor="location">
                  <TextField
                    id="location"
                    value={form.location ?? ''}
                    onChange={(e) => set('location', e.target.value)}
                    placeholder="Ej: Rosario, Santa Fe"
                  />
                </FormRow>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label="Instagram (opcional)" htmlFor="instagram">
                  <TextField
                    id="instagram"
                    value={form.instagram_url ?? ''}
                    onChange={(e) => set('instagram_url', e.target.value)}
                    placeholder="@tuusuario o instagram.com/tuusuario"
                  />
                </FormRow>
                <FormRow label="GitHub (opcional)" htmlFor="github">
                  <TextField
                    id="github"
                    type="text"
                    value={form.github_url ?? ''}
                    onChange={(e) => set('github_url', e.target.value)}
                    placeholder="https://github.com/…"
                  />
                </FormRow>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label="LinkedIn (opcional)" htmlFor="linkedin">
                  <TextField
                    id="linkedin"
                    type="text"
                    value={form.linkedin_url ?? ''}
                    onChange={(e) => set('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/…"
                  />
                </FormRow>
                <FormRow label="Portfolio / web (opcional)" htmlFor="portfolio">
                  <TextField
                    id="portfolio"
                    type="text"
                    value={form.portfolio_url ?? ''}
                    onChange={(e) => set('portfolio_url', e.target.value)}
                    placeholder="https://…"
                  />
                </FormRow>
              </div>

              <FormRow label="Link a tu CV (opcional)" htmlFor="cv">
                <TextField
                  id="cv"
                  type="text"
                  value={form.cv_url ?? ''}
                  onChange={(e) => set('cv_url', e.target.value)}
                  placeholder="https://…"
                />
              </FormRow>

          {/* Subir CV y analítico como archivo (PDF) */}
          <p className="rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-2.5 text-xs text-amber-100/90">
            El CV, el analítico y tu promedio solo son visibles para <strong>empresas</strong>. Otros estudiantes y embajadores no los ven.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 block text-sm font-medium text-white/80">
                Currículum (PDF, máx. {MAX_CV_MB} MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handlePdfUpload(e, 'cv')}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  as="button"
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading !== null}
                >
                  {uploading === 'cv' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" /> Subir CV
                    </>
                  )}
                </Button>
                {form.cv_url && uploading !== 'cv' && (
                  <a
                    href={form.cv_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                  >
                    <FileText className="h-4 w-4" /> Ver
                  </a>
                )}
              </div>
            </div>

            <div>
              <p className="mb-1.5 block text-sm font-medium text-white/80">
                Analítico / notas (PDF, máx. {MAX_CV_MB} MB)
              </p>
              <input
                ref={transcriptInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handlePdfUpload(e, 'transcript')}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  as="button"
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => transcriptInputRef.current?.click()}
                  disabled={uploading !== null}
                >
                  {uploading === 'transcript' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" /> Subir analítico
                    </>
                  )}
                </Button>
                {form.transcript_url && uploading !== 'transcript' && (
                  <a
                    href={form.transcript_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                  >
                    <FileText className="h-4 w-4" /> Ver
                  </a>
                )}
              </div>
            </div>
          </div>
          {uploadError && <p className="-mt-1 text-sm text-red-300">{uploadError}</p>}

              {/* Visibilidad para empresas */}
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => set('is_public', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 accent-brand-500"
                />
                <span className="text-sm text-white/80">
                  <span className="font-medium text-white">Perfil visible para empresas</span>
                  <br />
                  Las empresas van a poder encontrarte en el buscador de talento por tus
                  habilidades y área. Podés desactivarlo cuando quieras.
                </span>
              </label>
            </div>
          </EditSection>
        </div>
      </form>
      </div>
    );
  }

  const skillsArr = form.skills.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="max-w-4xl">
      <ProfileHeader
        name={fullName || 'Estudiante'}
        subtitle={[form.career, form.university, form.year].filter(Boolean).join(' · ') || 'Estudiante'}
        avatarUrl={form.avatar_url}
        userId={session!.user.id}
        onEdit={() => setEditing(true)}
      />

      <ProfileCompletion
        fields={[
          { label: 'Foto de perfil', done: !!(form.avatar_url ?? '').trim() },
          { label: 'Descripción', done: !!(form.bio ?? '').trim() },
          { label: 'Universidad', done: !!(form.university ?? '').trim() },
          { label: 'Carrera', done: !!(form.career ?? '').trim() },
          { label: 'Año', done: !!(form.year ?? '').trim() },
          { label: 'Área de interés', done: !!(form.area ?? '').trim() },
          { label: 'Habilidades', done: form.skills.trim() !== '' },
          { label: 'Disponibilidad', done: !!(form.availability ?? '').trim() },
          { label: 'Ubicación', done: !!(form.location ?? '').trim() },
          { label: 'Teléfono', done: !!(form.phone ?? '').trim() },
          { label: 'CV', done: !!(form.cv_url ?? '').trim() },
        ]}
      />

      <div className="grid gap-5">
        <Card className="p-4 sm:p-5">
          <p className="text-sm leading-6 text-white/65">
            {form.bio || 'Agregá una descripción breve para contar qué estás buscando.'}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <ProfileFact icon={<GraduationCap className="h-4 w-4" />} value={[form.career, form.university, form.year].filter(Boolean).join(' · ')} fallback="Completá tus estudios" />
            <ProfileFact icon={<BriefcaseBusiness className="h-4 w-4" />} value={form.area} fallback="Agregá un área de interés" />
            <ProfileFact icon={<Clock3 className="h-4 w-4" />} value={form.availability} fallback="Indicá tu disponibilidad" />
            <ProfileFact icon={<MapPin className="h-4 w-4" />} value={form.location} fallback="Agregá tu ubicación" />
          </div>
          {skillsArr.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {skillsArr.slice(0, 6).map((skill) => (
                <span key={skill} className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-xs text-white/70">{skill}</span>
              ))}
              {skillsArr.length > 6 && <span className="px-2 py-1 text-xs text-white/40">+{skillsArr.length - 6}</span>}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
            {linkChip(form.cv_url, 'CV')}
            {linkChip(form.transcript_url, 'Analítico')}
            {linkChip(form.linkedin_url, 'LinkedIn')}
            {linkChip(form.github_url, 'GitHub')}
            {linkChip(form.instagram_url, 'Instagram')}
            {linkChip(form.portfolio_url, 'Portfolio')}
            {!form.cv_url &&
              !form.transcript_url &&
              !form.linkedin_url &&
              !form.github_url &&
              !form.instagram_url &&
              !form.portfolio_url && (
                <p className="text-xs text-white/40">Todavía no agregaste links.</p>
              )}
          </div>
          <p className="mt-3 text-xs text-white/40">
            {form.is_public
              ? 'Tu perfil es visible para empresas en el buscador de talento.'
              : 'Tu perfil está oculto para las empresas. Activá la visibilidad al editar.'}
          </p>
        </Card>
        <StudentRecentActivity studentId={session!.user.id} />
      </div>
    </div>
  );
}

// Chips de sugerencias reutilizables: se tocan para elegir/agregar.
function SuggestChips({
  label,
  items,
  isActive,
  onPick,
}: {
  label: string;
  items: string[];
  isActive: (item: string) => boolean;
  onPick: (item: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="-mt-1">
      <p className="mb-2 text-xs font-medium text-white/50">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPick(item)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-white bg-white text-brand-600'
                  : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              {active ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditSection({ id, title, className = '', children }: { id?: string; title: string; className?: string; children: ReactNode }) {
  return (
    <details id={id} className={`group rounded-xl border border-white/10 bg-white/[0.03] ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-white marker:content-none sm:px-5 sm:py-4 sm:text-base">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-white/45 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/8 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">{children}</div>
    </details>
  );
}

function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (u.startsWith('@')) return normalizeProfileUrl(u, 'instagram');
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function ProfileFact({ icon, value, fallback }: { icon: ReactNode; value: string | null | undefined; fallback: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/[0.035] px-3 py-2.5">
      <span className="shrink-0 text-brand-400">{icon}</span>
      <span className={`truncate text-sm ${value ? 'text-white/75' : 'text-white/35'}`}>{value || fallback}</span>
    </div>
  );
}

function linkChip(url: string | null | undefined, label: string) {
  const href = safeHref(url);
  if (!href) return null;
  return (
    <a
      key={label}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-xs text-white/75 transition hover:bg-white/10"
    >
      {profileLinkLabel(url ?? '', label)}
    </a>
  );
}
