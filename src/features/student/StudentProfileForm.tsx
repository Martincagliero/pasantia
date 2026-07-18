// Estudiante: edita su perfil (nombre + datos académicos, links y CV).
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { UploadCloud, FileText, Loader2, Plus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { StudentProfile } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';
import { Card, PageHeader, PageLoader } from '../ui/primitives';
import { AVAILABILITY_OPTIONS, CAREERS, suggestFor } from './suggestions';

const MAX_CV_MB = 5;

export default function StudentProfileForm() {
  const { session, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<'cv' | 'transcript' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [form, setForm] = useState<Omit<StudentProfile, 'id' | 'skills'> & { skills: string }>({
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
        setForm({
          university: s.university ?? '',
          career: s.career ?? '',
          year: s.year ?? '',
          area: s.area ?? '',
          skills: (s.skills ?? []).join(', '),
          availability: s.availability ?? '',
          bio: s.bio ?? '',
          cv_url: s.cv_url ?? '',
          linkedin_url: s.linkedin_url ?? '',
          portfolio_url: s.portfolio_url ?? '',
          phone: s.phone ?? '',
          location: s.location ?? '',
          gpa: s.gpa ?? '',
          transcript_url: s.transcript_url ?? '',
          github_url: s.github_url ?? '',
          is_public: s.is_public ?? false,
        });
      }
      setFullName(profile?.full_name ?? '');
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
    setSaving(true);
    const uid = session!.user.id;
    await Promise.all([
      supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', uid),
      supabase
        .from('student_profiles')
        .update({
          university: form.university || null,
          career: form.career || null,
          year: form.year || null,
          area: form.area || null,
          skills: form.skills
            ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
            : null,
          availability: form.availability || null,
          bio: form.bio || null,
          cv_url: form.cv_url || null,
          linkedin_url: form.linkedin_url || null,
          portfolio_url: form.portfolio_url || null,
          phone: form.phone || null,
          location: form.location || null,
          gpa: form.gpa || null,
          transcript_url: form.transcript_url || null,
          github_url: form.github_url || null,
          is_public: form.is_public,
        })
        .eq('id', uid),
    ]);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Mi perfil"
        description="Completá tus datos para que las empresas te conozcan mejor."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <TextField
                id="uni"
                value={form.university ?? ''}
                onChange={(e) => set('university', e.target.value)}
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
                  <option key={y} value={y}>
                    {y}
                  </option>
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

          {/* Áreas sugeridas según la carrera */}
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

          {/* Habilidades sugeridas según la carrera (clic para agregar/quitar) */}
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

          {/* Disponibilidad sugerida */}
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
            <FormRow label="Promedio (opcional)" htmlFor="gpa">
              <TextField
                id="gpa"
                value={form.gpa ?? ''}
                onChange={(e) => set('gpa', e.target.value)}
                placeholder="Ej: 8.40"
              />
            </FormRow>
            <FormRow label="GitHub (opcional)" htmlFor="github">
              <TextField
                id="github"
                type="url"
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
                type="url"
                value={form.linkedin_url ?? ''}
                onChange={(e) => set('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/…"
              />
            </FormRow>
            <FormRow label="Portfolio / web (opcional)" htmlFor="portfolio">
              <TextField
                id="portfolio"
                type="url"
                value={form.portfolio_url ?? ''}
                onChange={(e) => set('portfolio_url', e.target.value)}
                placeholder="https://…"
              />
            </FormRow>
          </div>

          <FormRow label="Link a tu CV (opcional)" htmlFor="cv">
            <TextField
              id="cv"
              type="url"
              value={form.cv_url ?? ''}
              onChange={(e) => set('cv_url', e.target.value)}
              placeholder="https://…"
            />
          </FormRow>

          {/* Subir CV y analítico como archivo (PDF) */}
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
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 accent-white"
            />
            <span className="text-sm text-white/80">
              <span className="font-medium text-white">Perfil visible para empresas</span>
              <br />
              Las empresas van a poder encontrarte en el buscador de talento por tus
              habilidades y área. Podés desactivarlo cuando quieras.
            </span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="secondary" size="sm" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            {saved && <span className="text-sm text-emerald-300">Guardado ✓</span>}
          </div>
        </form>
      </Card>
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
