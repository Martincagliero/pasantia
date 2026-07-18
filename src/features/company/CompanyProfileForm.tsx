// Empresa: edita su perfil (nombre, rubro, tamaño, sitio, descripción).
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { CompanyProfile } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';
import { Card, PageHeader, PageLoader } from '../ui/primitives';

export default function CompanyProfileForm() {
  const { session, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState('');
  const [form, setForm] = useState<Omit<CompanyProfile, 'id'>>({
    company_name: '',
    industry: '',
    size: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('id', session!.user.id)
        .single();
      if (!active) return;
      if (data) {
        const c = data as CompanyProfile;
        setForm({
          company_name: c.company_name ?? '',
          industry: c.industry ?? '',
          size: c.size ?? '',
          website: c.website ?? '',
          description: c.description ?? '',
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const uid = session!.user.id;
    await Promise.all([
      supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', uid),
      supabase
        .from('company_profiles')
        .update({
          company_name: form.company_name || null,
          industry: form.industry || null,
          size: form.size || null,
          website: form.website || null,
          description: form.description || null,
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
        title="Perfil de empresa"
        description="Estos datos aparecen junto a tus pasantías."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormRow label="Nombre de contacto" htmlFor="contact">
            <TextField
              id="contact"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setSaved(false);
              }}
              required
            />
          </FormRow>

          <FormRow label="Nombre de la empresa" htmlFor="company">
            <TextField
              id="company"
              value={form.company_name ?? ''}
              onChange={(e) => set('company_name', e.target.value)}
              placeholder="Acme S.A."
            />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Rubro" htmlFor="industry">
              <TextField
                id="industry"
                value={form.industry ?? ''}
                onChange={(e) => set('industry', e.target.value)}
                placeholder="Ej: Software, Retail"
              />
            </FormRow>
            <FormRow label="Tamaño" htmlFor="size">
              <SelectField
                id="size"
                value={form.size ?? ''}
                onChange={(e) => set('size', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {['1-10', '11-50', '51-200', '201-500', '500+'].map((s) => (
                  <option key={s} value={s}>
                    {s} empleados
                  </option>
                ))}
              </SelectField>
            </FormRow>
          </div>

          <FormRow label="Sitio web (opcional)" htmlFor="website">
            <TextField
              id="website"
              type="url"
              value={form.website ?? ''}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://…"
            />
          </FormRow>

          <FormRow label="Descripción" htmlFor="description">
            <TextArea
              id="description"
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Contá a qué se dedica la empresa."
            />
          </FormRow>

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
