// Embajador: publicar una pasantía para su comunidad
import { useState, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Modality } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';

const emptyForm = {
  title: '',
  area: '',
  modality: 'presencial' as Modality,
  location: '',
  description: '',
  requirements: '',
};

interface AmbassadorInternshipFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export function AmbassadorInternshipForm({ onClose, onCreated }: AmbassadorInternshipFormProps) {
  const { session } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      company_id: session!.user.id,
      title: form.title.trim(),
      area: form.area.trim(),
      modality: form.modality,
      location: form.location.trim() || null,
      description: form.description.trim(),
      requirements: form.requirements.trim() || null,
      is_active: true,
    };

    const result = await supabase
      .from('internships')
      .insert(payload)
      .select()
      .single();

    setSaving(false);
    if (result.error) {
      setError('No se pudo publicar la pasantía. Revisá los datos e intentá de nuevo.');
      return;
    }

    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-b from-brand-950 to-black p-6 sm:p-8">
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

          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="secondary" size="sm" disabled={saving}>
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
