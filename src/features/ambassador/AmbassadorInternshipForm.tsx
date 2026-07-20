// Embajador: publicar una pasantía para su comunidad
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { X, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Modality } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';

const emptyForm = {
  title: '',
  company_name: '',
  area: '',
  modality: 'presencial' as Modality,
  location: '',
  description: '',
  requirements: '',
  image_url: '',
};

interface AmbassadorInternshipFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export function AmbassadorInternshipForm({ onClose, onCreated }: AmbassadorInternshipFormProps) {
  const { session } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const companyName = form.company_name.trim();
    const payload = {
      company_id: session!.user.id,
      title: form.title.trim(),
      company_name: companyName,
      area: form.area.trim(),
      modality: form.modality,
      location: form.location.trim() || null,
      description: form.description.trim(),
      requirements: form.requirements.trim() || null,
      image_url: form.image_url.trim() || null,
      is_active: true,
    };

    let result = await supabase.from('internships').insert(payload).select().single();

    // Si faltan las columnas nuevas (migración no corrida), reintentar sin ellas
    // para que la pasantía SE PUBLIQUE igual (la empresa queda en la descripción).
    if (
      result.error &&
      /company_name|image_url|column|schema cache|does not exist/i.test(result.error.message)
    ) {
      const fallback = {
        company_id: session!.user.id,
        title: payload.title,
        area: payload.area,
        modality: payload.modality,
        location: payload.location,
        description: companyName ? `Empresa: ${companyName}\n\n${payload.description}` : payload.description,
        requirements: payload.requirements,
        is_active: true,
      };
      result = await supabase.from('internships').insert(fallback).select().single();
    }

    if (result.error) {
      setSaving(false);
      const msg = result.error.message || '';
      if (/row-level security|violates|policy|permission|not authorized/i.test(msg)) {
        setError(
          'Tu cuenta no tiene permiso para publicar pasantías (regla de seguridad). ' +
            'El dueño debe correr supabase/migracion-fix-rls-recursion.sql en Supabase y verificar que tu rol sea "embajador". ' +
            'Detalle: ' + msg
        );
      } else {
        setError('No se pudo publicar la pasantía. Detalle: ' + msg);
      }
      return;
    }

    // Publicar la pasantía cuenta como difusión: suma puntos al embajador.
    const created = result.data as { id: string } | null;
    if (created?.id) {
      await supabase
        .from('internship_diffusions')
        .insert({ ambassador_id: session!.user.id, internship_id: created.id });
    }

    setSaving(false);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="dash-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Publicar pasantía</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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

          <FormRow label="Empresa" htmlFor="company_name">
            <TextField
              id="company_name"
              required
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              placeholder="Ej: Mercado Libre"
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

          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="secondary" size="sm" disabled={saving || uploading}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publicar'}
            </Button>
            <Button as="button" type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
