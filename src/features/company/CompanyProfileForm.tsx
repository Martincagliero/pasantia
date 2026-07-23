// Empresa: perfil estilo LinkedIn (vista con datos + publicaciones) y modo edición.
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ExternalLink, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { CompanyProfile } from '../../lib/database.types';
import { whatsappLink } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';
import { Card, EmptyState, PageLoader } from '../ui/primitives';
import { AvatarUpload } from '../ui/AvatarUpload';
import { ProfileHeader } from '../ui/ProfileHeader';
import { ProfileCompletion } from '../ui/ProfileCompletion';
import { UserPosts } from '../posts/UserPosts';

interface InternshipLite {
  id: string;
  title: string;
  is_active: boolean;
}

function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export default function CompanyProfileForm() {
  const { session, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [verified, setVerified] = useState(false);
  const [requested, setRequested] = useState(false);
  const [internships, setInternships] = useState<InternshipLite[]>([]);

  const [fullName, setFullName] = useState('');
  const [form, setForm] = useState<Omit<CompanyProfile, 'id' | 'verified' | 'verification_requested'>>({
    avatar_url: '',
    company_name: '',
    industry: '',
    size: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data }, { data: ints }] = await Promise.all([
        supabase.from('company_profiles').select('*').eq('id', session!.user.id).single(),
        supabase
          .from('internships')
          .select('id, title, is_active')
          .eq('company_id', session!.user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (!active) return;
      if (data) {
        const c = data as CompanyProfile;
        setForm({
          avatar_url: c.avatar_url ?? '',
          company_name: c.company_name ?? '',
          industry: c.industry ?? '',
          size: c.size ?? '',
          website: c.website ?? '',
          description: c.description ?? '',
        });
        setVerified(!!c.verified);
        setRequested(!!c.verification_requested);
      }
      setInternships((ints as InternshipLite[]) ?? []);
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

  async function requestVerification() {
    const msg =
      `Hola! Quiero solicitar la verificación de mi cuenta de EMPRESA en PasantIA.\n` +
      `Empresa: ${form.company_name || '-'}\n` +
      `Contacto: ${fullName || '-'}\n` +
      `Email: ${profile?.email || '-'}`;
    window.open(whatsappLink(msg), '_blank');
    try {
      await supabase
        .from('company_profiles')
        .update({ verification_requested: true })
        .eq('id', session!.user.id);
      setRequested(true);
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!(form.avatar_url ?? '').trim()) {
      alert('Tenés que subir el logo/foto de la empresa para guardar el perfil.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    const uid = session!.user.id;
    await Promise.all([
      supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', uid),
      supabase
        .from('company_profiles')
        .update({
          avatar_url: form.avatar_url || null,
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
    setEditing(false);
  }

  if (loading) return <PageLoader />;

  // ─────────────────────────── MODO EDICIÓN ───────────────────────────
  if (editing) {
    return (
      <div className="max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-white">Editar perfil</h1>
          <Button as="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AvatarUpload
              uid={session!.user.id}
              value={form.avatar_url ?? ''}
              onChange={(url) => set('avatar_url', url)}
              label="Logo de la empresa"
              hint="Lo ven los estudiantes junto a tus pasantías. JPG, PNG o WEBP · máx 5 MB."
            />

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
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              {saved && <span className="text-sm text-emerald-300">Guardado</span>}
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // ─────────────────────────── MODO VISTA ───────────────────────────
  const website = safeHref(form.website);
  const activeCount = internships.filter((i) => i.is_active).length;

  return (
    <div className="max-w-3xl">
      <ProfileHeader
        name={form.company_name || fullName || 'Empresa'}
        subtitle={[form.industry, form.size && `${form.size} empleados`].filter(Boolean).join(' · ') || 'Empresa'}
        avatarUrl={form.avatar_url}
        verified={verified}
        requested={requested}
        onEdit={() => setEditing(true)}
        onRequestVerification={requestVerification}
      />

      <ProfileCompletion
        fields={[
          { label: 'Logo', done: !!(form.avatar_url ?? '').trim() },
          { label: 'Nombre de la empresa', done: !!(form.company_name ?? '').trim() },
          { label: 'Contacto', done: !!fullName.trim() },
          { label: 'Rubro', done: !!(form.industry ?? '').trim() },
          { label: 'Tamaño', done: !!(form.size ?? '').trim() },
          { label: 'Sitio web', done: !!(form.website ?? '').trim() },
          { label: 'Descripción', done: !!(form.description ?? '').trim() },
        ]}
      />

      <div className="grid gap-6">
        <Card>
          <h3 className="mb-3 text-base font-semibold text-white">Sobre la empresa</h3>
          <p className="text-sm leading-relaxed text-white/70">
            {form.description || 'Todavía no agregaste una descripción. Tocá “Editar perfil” para completarla.'}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <ViewField label="Contacto" value={fullName} />
            <ViewField label="Rubro" value={form.industry} />
            <ViewField label="Tamaño" value={form.size ? `${form.size} empleados` : null} />
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/40">Sitio web</dt>
              <dd className="mt-0.5 text-sm text-white/80">
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-300 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" /> Visitar
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">
              Pasantías publicadas <span className="text-white/45">({activeCount} activas)</span>
            </h3>
            <Link to="/app/mis-pasantias" className="text-sm text-white/60 transition hover:text-white">
              Ver todas
            </Link>
          </div>
          {internships.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="Todavía no publicaste pasantías"
              description="Cuando publiques, aparecerán acá."
            />
          ) : (
            <div className="space-y-2">
              {internships.slice(0, 6).map((i) => (
                <Link
                  key={i.id}
                  to={`/app/pasantia/${i.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.05]"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-white">{i.title}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-white/50">
                    {i.is_active ? (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300">Activa</span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">Inactiva</span>
                    )}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <UserPosts
          authorId={session!.user.id}
          title="Publicaciones de la empresa en Novedades"
          emptyText="Todavía no publicaste nada en Novedades."
        />
      </div>
    </div>
  );
}

function ViewField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-white/40">{label}</dt>
      <dd className="mt-0.5 text-sm text-white/80">{value || '—'}</dd>
    </div>
  );
}
