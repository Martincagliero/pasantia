// Embajador: perfil. Editar datos de la comunidad, Instagram, verificación.
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { AmbassadorProfile, AmbassadorOrgType } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { TextField } from '../ui/Field';
import { Card, PageHeader, PageLoader } from '../ui/primitives';
import { VerifiedBadge } from './VerifiedBadge';
import { ORG_TYPES } from './ambassadorConfig';
import { Upload } from 'lucide-react';

export default function AmbassadorProfile() {
  const { session } = useAuth();
  const [amb, setAmb] = useState<AmbassadorProfile | null>(null);
  const [form, setForm] = useState({
    org_name: '',
    org_type: 'cuenta_instagram' as AmbassadorOrgType,
    university: '',
    instagram_url: '',
    reach: '',
    description: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('ambassador_profiles')
          .select('*')
          .eq('id', session!.user.id)
          .single();
        if (!active) return;
        if (data) {
          const a = data as AmbassadorProfile;
          setAmb(a);
          setForm({
          org_name: a.org_name ?? '',
          org_type: (a.org_type as AmbassadorOrgType) ?? 'cuenta_instagram',
          university: a.university ?? '',
          instagram_url: a.instagram_url ?? '',
          reach: a.reach ?? '',
          description: a.description ?? '',
          logo_url: a.logo_url ?? '',
        });
      }
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 2MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      alert('El logo debe pesar menos de 2MB. Tu archivo pesa ' + (file.size / 1024 / 1024).toFixed(2) + 'MB');
      return;
    }

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen (JPG, PNG, GIF o WEBP)');
      return;
    }

    // Validar extensión
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!validExts.includes(ext)) {
      alert('Formato de imagen no válido. Usa JPG, PNG, GIF o WEBP');
      return;
    }

    setUploading(true);
    const path = `ambassadors/${session!.user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert('Error subiendo logo: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from('cvs')
      .getPublicUrl(path);

    set('logo_url', data.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from('ambassador_profiles')
      .update({
        org_name: form.org_name || null,
        org_type: form.org_type,
        university: form.university || null,
        instagram_url: form.instagram_url || null,
        reach: form.reach || null,
        description: form.description || null,
        logo_url: form.logo_url || null,
      })
      .eq('id', session!.user.id);
    setSaving(false);
    setSaved(true);
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Mi comunidad"
        description="Completá los datos de tu comunidad para que las empresas te conozcan."
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Columna izquierda: identidad de la comunidad ── */}
          <Card>
            <h3 className="mb-5 text-base font-semibold text-white">Identidad</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-white/60">Estado: {amb?.org_name}</span>
                <VerifiedBadge verified={!!amb?.verified} />
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Logo / Avatar (máx 2MB)</label>
                <p className="text-xs text-white/50 mb-3">Recomendado: cuadrado, 500×500px</p>
                <div className="flex items-end gap-3">
                  {form.logo_url && (
                    <div className="relative">
                      <img
                        src={form.logo_url}
                        alt="Logo"
                        className="h-16 w-16 rounded-xl object-cover border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => set('logo_url', '')}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500/80 flex items-center justify-center text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-4 py-3 transition hover:border-white/40 hover:bg-white/10">
                      <Upload size={18} className="text-white/60" />
                      <span className="text-sm font-medium text-white/70">
                        {uploading ? 'Subiendo…' : 'Subir logo'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Nombre de la comunidad</label>
                <TextField
                  value={form.org_name}
                  onChange={(e) => set('org_name', e.target.value)}
                  placeholder="Ej: ICES, Centro de Estudiantes, Ingeniería UTN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Tipo</label>
                <select
                  value={form.org_type}
                  onChange={(e) => set('org_type', e.target.value as AmbassadorOrgType)}
                  className="glass w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/40 transition focus:border-white/40 focus:outline-none"
                >
                  {ORG_TYPES.map((o) => (
                    <option key={o.value} value={o.value} className="bg-brand-950 text-white">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Universidad / Institución (opcional)</label>
                <TextField
                  value={form.university}
                  onChange={(e) => set('university', e.target.value)}
                  placeholder="Ej: UTN, UB, UNLP"
                />
              </div>
            </div>
          </Card>

          {/* ── Columna derecha: redes y descripción ── */}
          <Card>
            <h3 className="mb-5 text-base font-semibold text-white">Presencia en redes</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Instagram *</label>
                <TextField
                  value={form.instagram_url}
                  onChange={(e) => set('instagram_url', e.target.value)}
                  type="url"
                  placeholder="https://instagram.com/…"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Alcance / Seguidores (aproximado)</label>
                <TextField
                  value={form.reach}
                  onChange={(e) => set('reach', e.target.value)}
                  placeholder="Ej: 2.5k seguidores, 500+ activos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Sobre tu comunidad</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describí en qué se enfoca tu comunidad, cómo es tu audiencia, en qué temas podés difundir pasantías, etc."
                  className="glass w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/40 transition focus:border-white/40 focus:outline-none"
                  rows={6}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" variant="secondary" size="sm" disabled={saving || uploading}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
                {saved && <span className="text-sm text-emerald-300">Guardado ✓</span>}
              </div>
            </div>
          </Card>
        </div>
      </form>

      {amb?.verified && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-2 font-semibold text-white">✅ Cuenta verificada</h3>
            <p className="text-sm text-white/70">
              Ahora podés difundir todas las pasantías que quieras en Instagram y tus seguidores podrán postularse directamente desde PasantIA.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-5">
            <h4 className="font-semibold text-brand-200 mb-2">🎯 Cómo ganar puntos:</h4>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• <strong>+10 puntos</strong> por cada pasantía que difundas</li>
              <li>• Los puntos se suman automáticamente cuando marcas "Difundida"</li>
              <li>• Competí en el ranking y demostrá tu influencia</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
            <h4 className="font-semibold text-sky-200 mb-2">📱 Cómo funciona:</h4>
            <ol className="text-sm text-white/70 space-y-1">
              <li>1. Las empresas publican pasantías en PasantIA</li>
              <li>2. Te eligen para difundirlas en tu Instagram</li>
              <li>3. Compartís el link con tus seguidores</li>
              <li>4. Marcás la pasantía como "Difundida" → ganan puntos</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
