// Empresa: publicar una nueva pasantía o editar una existente (?id=...).
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Internship, Modality, AmbassadorProfile } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';
import { Card, PageHeader, PageLoader } from '../ui/primitives';
import { useModalGuard } from '../ui/modalGuard';
import { BadgeCheck, ChevronDown, X, ImagePlus, Trash2 } from 'lucide-react';

const emptyForm = {
  title: '',
  area: '',
  modality: 'presencial' as Modality,
  location: '',
  description: '',
  requirements: '',
  experience_years: '',
  image_url: '',
  is_active: true,
};

export default function InternshipForm({
  editId: editIdProp,
  asModal,
  onDone,
  onCancel,
}: {
  editId?: string | null;
  asModal?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
} = {}) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = editIdProp !== undefined ? editIdProp : params.get('id');
  useModalGuard(!!asModal);

  function handleCancel() {
    if (onCancel) onCancel();
    else navigate(-1);
  }

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [selectedAmbassadors, setSelectedAmbassadors] = useState<string[]>([]);
  const [commOpen, setCommOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);

  useEffect(() => {
    if (!editId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('internships')
        .select('*')
        .eq('id', editId)
        .single();
      if (!active) return;
      if (data) {
        const i = data as Internship;
        setForm({
          title: i.title,
          area: i.area,
          modality: i.modality,
          location: i.location ?? '',
          description: i.description,
          requirements: i.requirements ?? '',
          experience_years: i.experience_years != null ? String(i.experience_years) : '',
          image_url: i.image_url ?? '',
          is_active: i.is_active,
        });
        if ((i.requirements ?? '') !== '' || i.experience_years != null) setReqOpen(true);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [editId]);

  // Cargar embajadores verificados
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('ambassador_profiles')
        .select('*')
        .eq('verified', true);
      if (!active) return;
      setAmbassadors((data as AmbassadorProfile[]) || []);
    })();
    return () => {
      active = false;
    };
  }, []);



  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG o WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `internships/${session!.user.id}-${Date.now()}.${ext}`;
    setUploading(true);
    const { error: upErr } = await supabase.storage.from('cvs').upload(path, file, { upsert: true });
    if (upErr) {
      setError('No se pudo subir la imagen. Verificá que el bucket "cvs" exista.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('cvs').getPublicUrl(path);
    set('image_url', `${data.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      area: form.area.trim(),
      modality: form.modality,
      location: form.location.trim() || null,
      description: form.description.trim(),
      requirements: form.requirements.trim() || null,
      experience_years: form.experience_years ? Number(form.experience_years) : null,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    };

    async function save(pl: typeof payload | Omit<typeof payload, 'image_url' | 'experience_years'>) {
      return editId
        ? await supabase.from('internships').update(pl).eq('id', editId)
        : await supabase
            .from('internships')
            .insert({ ...pl, company_id: session!.user.id })
            .select()
            .single();
    }

    let result = await save(payload);
    // Si falta alguna columna nueva (migración no corrida), guardar sin ella.
    if (result.error && /experience_years|image_url|column|schema cache|does not exist/i.test(result.error.message)) {
      const { image_url, experience_years, ...rest } = payload;
      void image_url;
      void experience_years;
      result = await save(rest);
    }

    setSaving(false);
    if (result.error) {
      setError('No se pudo guardar la pasantía. Revisá los datos e intentá de nuevo.');
      return;
    }

    // Si hay embajadores seleccionados, crear internship_broadcasts
    const internshipId = editId || (result.data as any).id;
    if (selectedAmbassadors.length > 0 && internshipId) {
      const broadcasts = selectedAmbassadors.map((ambId) => ({
        internship_id: internshipId,
        ambassador_id: ambId,
      }));

      // Primero, borrar los broadcasts anteriores si estamos editando
      if (editId) {
        await supabase
          .from('internship_broadcasts')
          .delete()
          .eq('internship_id', editId);
      }

      // Luego, insertar los nuevos
      await supabase.from('internship_broadcasts').insert(broadcasts);
    }

    if (onDone) onDone();
    else navigate('/app/mis-pasantias');
  }

  if (loading) return <PageLoader />;

  return (
    <div
      className={asModal ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' : 'max-w-2xl'}
      onClick={asModal ? handleCancel : undefined}
    >
      {!asModal && (
        <PageHeader
          title={editId ? 'Editar pasantía' : 'Publicar pasantía'}
          description="Describí la oportunidad para atraer a los mejores candidatos."
        />
      )}

      <div
        className={asModal ? 'w-full max-w-2xl' : 'contents'}
        onClick={asModal ? (e) => e.stopPropagation() : undefined}
      >
        <Card className={asModal ? 'max-h-[85vh] overflow-y-auto' : ''}>
          {asModal && (
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editId ? 'Editar pasantía' : 'Publicar pasantía'}
                </h2>
                <p className="mt-0.5 text-sm text-white/60">
                  Describí la oportunidad para atraer a los mejores candidatos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
          <FormRow label="Título" htmlFor="title">
            <TextField
              id="title"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Pasantía en Desarrollo Frontend"
            />
          </FormRow>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormRow label="Área" htmlFor="area">
              <TextField
                id="area"
                required
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                placeholder="Ej: Tecnología"
              />
            </FormRow>
            <FormRow label="Modalidad" htmlFor="modality">
              <SelectField
                id="modality"
                value={form.modality}
                onChange={(e) => set('modality', e.target.value as Modality)}
              >
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </SelectField>
            </FormRow>
          </div>

          <FormRow label="Ubicación (opcional)" htmlFor="location">
            <TextField
              id="location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Ej: Buenos Aires"
            />
          </FormRow>

          <FormRow label="Descripción" htmlFor="description">
            <TextArea
              id="description"
              required
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Tareas, objetivos y qué se espera del pasante."
              className="min-h-[70px]"
            />
          </FormRow>

          {/* Requisitos (módulo opcional) */}
          <div className="rounded-xl border border-white/10 bg-white/5">
            <button
              type="button"
              onClick={() => setReqOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left"
            >
              <div>
                <h3 className="text-sm font-semibold text-white">Requisitos (opcional)</h3>
                <p className="mt-0.5 text-xs text-white/60">
                  Sumá años de experiencia y otros requisitos para esta pasantía.
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-white/50 transition-transform ${reqOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {reqOpen && (
              <div className="space-y-3 border-t border-white/10 px-3.5 pb-3.5 pt-3">
                <FormRow label="Años de experiencia" htmlFor="experience_years">
                  <SelectField
                    id="experience_years"
                    value={form.experience_years}
                    onChange={(e) => set('experience_years', e.target.value)}
                  >
                    <option value="">Sin especificar</option>
                    <option value="0">Sin experiencia</option>
                    <option value="1">1 año</option>
                    <option value="2">2 años</option>
                    <option value="3">3 años</option>
                    <option value="4">4 años</option>
                    <option value="5">5 años o más</option>
                  </SelectField>
                </FormRow>
                <FormRow label="Otros requisitos" htmlFor="requirements">
                  <TextArea
                    id="requirements"
                    rows={2}
                    value={form.requirements}
                    onChange={(e) => set('requirements', e.target.value)}
                    placeholder="Conocimientos, año de cursada, habilidades deseadas."
                    className="min-h-[56px]"
                  />
                </FormRow>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Imagen (opcional)</label>
            {form.image_url ? (
              <div className="flex items-center gap-3">
                <div className="h-20 w-28 overflow-hidden rounded-xl border border-white/12 bg-white/5">
                  <img src={form.image_url} alt="Pasantía" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => set('image_url', '')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" /> Quitar
                </button>
              </div>
            ) : (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                <ImagePlus className="h-4 w-4" />
                {uploading ? 'Subiendo…' : 'Subir imagen'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
            <p className="mt-1.5 text-xs text-white/45">JPG, PNG o WEBP · máx 5 MB</p>
          </div>

          {/* Difundir en embajadores verificados */}
          {ambassadors.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setCommOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white">Difundir en comunidades</h3>
                  <p className="mt-0.5 text-xs text-white/60">
                    Elegí las comunidades que reciben un punto directo a esta pasantía.
                    {selectedAmbassadors.length > 0 && ` (${selectedAmbassadors.length} seleccionada${selectedAmbassadors.length > 1 ? 's' : ''})`}
                  </p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-white/50 transition-transform ${commOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {commOpen && (
                <div className="mt-3 space-y-2">
                  {ambassadors.map((amb) => (
                    <label
                      key={amb.id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAmbassadors.includes(amb.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAmbassadors([...selectedAmbassadors, amb.id]);
                          } else {
                            setSelectedAmbassadors(
                              selectedAmbassadors.filter((id) => id !== amb.id)
                            );
                          }
                        }}
                        className="h-4 w-4 rounded border-white/30 bg-white/10 accent-white"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {amb.org_name}
                          </span>
                          {amb.verified && (
                            <BadgeCheck className="h-4 w-4 text-sky-400" />
                          )}
                        </div>
                        <div className="text-xs text-white/50">
                          {amb.org_type === 'cuenta_instagram' ? amb.university : amb.org_type} •{' '}
                          {amb.reach || '?'} seguidores
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}



          <label className="flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-white/10 accent-white"
            />
            Publicar como activa (visible para estudiantes)
          </label>

          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="secondary" size="sm" disabled={saving || uploading}>
              {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Publicar'}
            </Button>
            <Button as="button" type="button" variant="ghost" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </form>
        </Card>
      </div>
    </div>
  );
}
