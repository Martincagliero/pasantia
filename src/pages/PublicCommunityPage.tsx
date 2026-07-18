// Página pública: unirse a una comunidad desde link compartido + ver pasantías
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, ArrowLeft, Loader2, CheckCircle2, Building2, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/AuthProvider';
import type { Community, InternshipWithCompany, Modality } from '../lib/database.types';
import { Button } from '../components/ui/Button';
import { Card, EmptyState } from '../features/ui/primitives';
import { useEarlyAccess } from '../components/early-access/EarlyAccess';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export default function PublicCommunityPage() {
  const { id } = useParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { open: openEarlyAccess } = useEarlyAccess();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [internships, setInternships] = useState<InternshipWithCompany[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Fetch comunidad
        const { data: commData, error: commError } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();
        if (commError) throw commError;
        if (active) setCommunity((commData as Community) ?? null);

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

        // Si autenticado, revisar si ya es miembro
        if (session?.user.id && active) {
          const { count } = await supabase
            .from('community_members')
            .select('id', { count: 'exact' })
            .eq('community_id', id)
            .eq('student_id', session.user.id);
          if (active) setIsMember((count ?? 0) > 0);
        }
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, session]);

  async function handleJoin() {
    if (!session) {
      navigate('/ingresar', { state: { from: window.location.pathname } });
      return;
    }
    if (profile?.role !== 'estudiante') {
      alert('Solo estudiantes pueden unirse a comunidades');
      return;
    }
    setJoining(true);
    try {
      await supabase.from('community_members').insert({
        community_id: id,
        student_id: session.user.id,
      });
      setIsMember(true);
      setJoined(true);
      setTimeout(() => {
        if (session.user.id) navigate('/app/comunidades');
      }, 1500);
    } catch (err: any) {
      if (!err.message?.includes('duplicate')) {
        alert('Error al unirse a la comunidad');
      }
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-950 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-300 mx-auto mb-3" />
          <p className="text-white/60">Cargando comunidad...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-950 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl font-semibold text-white mb-4">Comunidad no encontrada</p>
          <Button as="link" to="/" variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-950 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white mb-8 transition">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <Card className="border-white/15 text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-brand-300/10">
              <Users className="h-8 w-8 text-brand-300" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">{community.name}</h1>

          {community.description && (
            <p className="text-white/70 mb-4 max-w-md mx-auto">{community.description}</p>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-white/50 mb-6">
            <Users className="h-4 w-4" />
            <span>{community.members_count} miembros</span>
          </div>

          {joined && (
            <div className="mb-4 flex items-center justify-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <span>¡Bienvenido a la comunidad!</span>
            </div>
          )}

          <div className="flex gap-3 flex-col-reverse sm:flex-row sm:justify-center">
            {!isMember && !joined && (
              <Button
                as="button"
                variant="primary"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unirme a la comunidad'}
              </Button>
            )}
            {(isMember || joined) && (
              <Button as="button" variant="secondary" disabled>
                <CheckCircle2 className="h-4 w-4" />
                Ya soy miembro
              </Button>
            )}
            {!session && (
              <Button as="link" to="/ingresar" variant="primary">
                Ingresar para unirme
              </Button>
            )}
          </div>

          <p className="text-xs text-white/40 mt-6">
            ¿Necesitás una cuenta?{' '}
            {!session && (
              <button
                type="button"
                onClick={() => openEarlyAccess()}
                className="text-brand-300 hover:text-brand-200"
              >
                Sumate al acceso anticipado
              </button>
            )}
          </p>
        </Card>

        {/* Pasantías de la comunidad */}
        {internships.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Oportunidades en {community.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {internships.map((i) => (
                <button
                  key={i.id}
                  onClick={() => navigate(`/app/pasantias?id=${i.id}`)}
                  className="text-left hover:scale-105 transition-transform"
                >
                  <Card hover className="flex flex-col h-full">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2 text-sm text-white/60">
                        <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{i.company?.company_name || 'Empresa'}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-white">{i.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                        {i.area}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                        {modalityLabel[i.modality]}
                      </span>
                      {i.location && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                          <MapPin className="h-3 w-3" /> {i.location}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm text-white/60">{i.description}</p>
                    <div className="mt-5">
                      {session && profile?.role === 'estudiante' ? (
                        <Button as="button" variant="secondary" size="sm" className="w-full">
                          <Briefcase className="h-4 w-4" />
                          Ver y postularse
                        </Button>
                      ) : (
                        <Button as="link" to="/ingresar" variant="secondary" size="sm" className="w-full">
                          <Briefcase className="h-4 w-4" />
                          Postularse
                        </Button>
                      )}
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

        {internships.length === 0 && (isMember || joined) && (
          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title="No hay pasantías en esta comunidad"
            description="Cuando se publiquen nuevas oportunidades aparecerán aquí."
          />
        )}
      </div>
    </div>
  );
}
