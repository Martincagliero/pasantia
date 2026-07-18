// Empresa: publicar una nueva pasantía o editar una existente (?id=...).
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Internship, Modality, AmbassadorProfile } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';
import { Card, PageHeader, PageLoader } from '../ui/primitives';
import { BadgeCheck } from 'lucide-react';

const emptyForm = {
  title: '',
  area: '',
  modality: 'presencial' as Modality,
  location: '',
  description: '',
  requirements: '',
  is_active: true,
};

export default function InternshipForm() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id');

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [selectedAmbassadors, setSelectedAmbassadors] = useState<string[]>([]);

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
          is_active: i.is_active,
        });
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
      is_active: form.is_active,
    };

    const result = editId
      ? await supabase.from('internships').update(payload).eq('id', editId)
      : await supabase
          .from('internships')
          .insert({ ...payload, company_id: session!.user.id })
          .select()
          .single();

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

    navigate('/app/mis-pasantias');
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={editId ? 'Editar pasantía' : 'Publicar pasantía'}
        description="Describí la oportunidad para atraer a los mejores candidatos."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormRow label="Título" htmlFor="title">
            <TextField
              id="title"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Pasantía en Desarrollo Frontend"
            />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
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
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Tareas, objetivos y qué se espera del pasante."
            />
          </FormRow>

          <FormRow label="Requisitos (opcional)" htmlFor="requirements">
            <TextArea
              id="requirements"
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
              placeholder="Conocimientos, año de cursada, habilidades deseadas."
            />
          </FormRow>

          {/* Difundir en embajadores verificados */}
          {ambassadors.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-white">
                Difundir en comunidades
              </h3>
              <p className="mb-3 text-xs text-white/60">
                Seleccioná las comunidades que van a recibir un punto directo a esta pasantía.
              </p>
              <div className="space-y-2">
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
            <Button type="submit" variant="secondary" size="sm" disabled={saving}>
              {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Publicar'}
            </Button>
            <Button as="button" type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
