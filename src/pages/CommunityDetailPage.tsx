// Vista interna de comunidad para miembros - tipo chat/feed
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Loader2, Briefcase, Building2, MapPin, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/AuthProvider';
import type { Community, InternshipWithCompany, Modality } from '../lib/database.types';
import { Button } from '../components/ui/Button';
import { Card, EmptyState, PageHeader, PageLoader } from '../features/ui/primitives';
import { TextField, TextArea, SelectField } from '../features/ui/Field';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState<Community | null>(null);
  const [internships, setInternships] = useState<InternshipWithCompany[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    title: '',
    area: '',
    modality: 'presencial' as Modality,
    location: '',
    description: '',
    requirements: '',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Fetch comunidad
        const { data: commData } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();
        if (active) setCommunity((commData as Community) ?? null);

        // Verificar si es miembro
        if (session?.user.id && active) {
          const { count } = await supabase
            .from('community_members')
            .select('id', { count: 'exact' })
            .eq('community_id', id)
            .eq('student_id', session.user.id);
          if ((count ?? 0) === 0) {
            navigate(`/comunidad/${id}`);
            return;
          }
          setIsMember(true);
        } else {
          navigate(`/comunidad/${id}`);
          return;
        }

        // Fetch pasantías de la comunidad
        const { data: commInternships } = await supabase
          .from('community_internships')
          .select('internship_id')
          .eq('community_id', id);

        if (commInternships && commInternships.length > 0) {
          const internshipIds = commInternships.map((ci) => ci.internship_id);
          const { data: internData } = await supabase
            .from('internships')
            .select('*, company:company_profiles(company_name, industry)')
            .in('id', internshipIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          if (active) setInternships((internData as InternshipWithCompany[]) ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, session, navigate]);

  async function handlePublish() {
    if (!form.title.trim() || !form.area.trim() || !form.description.trim()) {
      alert('Completa los campos requeridos');
      return;
    }

    setPublishing(true);
    try {
      // Crear pasantía
      const { data: newInternship, error: insertError } = await supabase
        .from('internships')
        .insert({
          company_id: session!.user.id,
          title: form.title.trim(),
          area: form.area.trim(),
          modality: form.modality,
          location: form.location.trim() || null,
          description: form.description.trim(),
          requirements: form.requirements.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Agregar a la comunidad
      const { error: commError } = await supabase
        .from('community_internships')
        .insert({
          community_id: id!,
          internship_id: (newInternship as any).id,
        });

      if (commError) throw commError;

      // Recargar pasantías
      const { data: commInternships } = await supabase
        .from('community_internships')
        .select('internship_id')
        .eq('community_id', id);

      if (commInternships && commInternships.length > 0) {
        const internshipIds = commInternships.map((ci) => ci.internship_id);
        const { data: internData } = await supabase
          .from('internships')
          .select('*, company:company_profiles(company_name, industry)')
          .in('id', internshipIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        setInternships((internData as InternshipWithCompany[]) ?? []);
      }

      // Reset form
      setForm({
        title: '',
        area: '',
        modality: 'presencial',
        location: '',
        description: '',
        requirements: '',
      });
      setShowForm(false);
    } catch (err: any) {
      console.error(err);
      alert('Error al publicar: ' + err.message);
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <PageLoader />;

  if (!isMember || !community) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Acceso denegado"
          description="Necesitas ser miembro de la comunidad para acceder."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={community.name}
        description={community.description || 'Comunidad de estudiantes'}
        action={
          <Button
            as="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancelar' : 'Compartir pasantía'}
          </Button>
        }
      />

      <div className="flex items-center gap-2 text-sm text-white/60 mb-6">
        <Users className="h-4 w-4" />
        <span>{community.members_count} miembros</span>
      </div>

      {/* Formulario para publicar pasantía */}
      {showForm && (
        <Card className="mb-6 border-white/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Compartir pasantía en {community.name}</h3>
            <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Título *
              </label>
              <TextField
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Pasantía en Desarrollo Frontend"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Área *
                </label>
                <TextField
                  value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                  placeholder="Ej: Tecnología"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Modalidad
                </label>
                <SelectField
                  value={form.modality}
                  onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value as Modality }))}
                >
                  <option value="presencial">Presencial</option>
                  <option value="remoto">Remoto</option>
                  <option value="hibrido">Híbrido</option>
                </SelectField>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Ubicación
              </label>
              <TextField
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Ej: Buenos Aires"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Descripción *
              </label>
              <TextArea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Tareas, objetivos y qué se espera del pasante."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Requisitos
              </label>
              <TextArea
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                placeholder="Conocimientos, año de cursada, habilidades deseadas."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                as="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                as="button"
                variant="primary"
                size="sm"
                onClick={handlePublish}
                disabled={publishing || !form.title.trim() || !form.area.trim() || !form.description.trim()}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compartir'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Feed/Chat de pasantías */}
      {internships.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Pasantías en la comunidad</h2>
          {internships.map((i) => (
            <button
              key={i.id}
              onClick={() => navigate(`/app/pasantias?id=${i.id}`)}
              className="w-full text-left"
            >
              <Card hover className="cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-white/60 shrink-0" strokeWidth={1.75} />
                      <span className="text-sm text-white/60">{i.company?.company_name || 'Empresa'}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{i.title}</h3>
                    <p className="text-white/70 mb-3 line-clamp-2">{i.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {i.area}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {modalityLabel[i.modality]}
                      </span>
                      {i.location && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                          <MapPin className="h-3 w-3" />
                          {i.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button as="button" variant="secondary" size="sm" className="shrink-0">
                    <Briefcase className="h-4 w-4" />
                    Ver
                  </Button>
                </div>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="No hay pasantías aún"
          description="Sé el primero en compartir una oportunidad en esta comunidad."
        />
      )}
    </div>
  );
}
