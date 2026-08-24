import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, Newspaper, Search, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Community, Internship, Post, Profile } from '../../lib/database.types';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { LinkPreview } from '../ui/LinkPreview';
import { useAuth } from '../auth/AuthProvider';
import { SocialPostImages, SocialPostText } from '../posts/SocialPostContent';
import { PostActionsMenu } from '../posts/PostActionsMenu';

type SearchProfile = Pick<Profile, 'id' | 'full_name' | 'role'>;

const roleLabel: Record<Profile['role'], string> = {
  estudiante: 'Estudiante',
  empresa: 'Empresa',
  embajador: 'Comunidad',
};

const categoryLabel: Record<Post['category'], string> = {
  novedad: 'Novedad',
  proyecto: 'Proyecto',
  busqueda: 'Búsqueda',
  recurso: 'Recurso',
};

function searchable(parts: unknown[]): string {
  return parts
    .filter((part): part is string | number => typeof part === 'string' || typeof part === 'number')
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';
}

export default function GlobalSearch() {
  const [params] = useSearchParams();
  const { profile, session } = useAuth();
  const query = params.get('q')?.trim() ?? '';
  const normalizedQuery = searchable([query]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      const [profileResult, postResult, internshipResult, communityResult] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role').limit(150),
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(150),
        supabase
          .from('internships')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('communities')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(150),
      ]);
      if (!active) return;
      setProfiles((profileResult.data as SearchProfile[] | null) ?? []);
      setPosts((postResult.data as Post[] | null) ?? []);
      setInternships((internshipResult.data as Internship[] | null) ?? []);
      setCommunities((communityResult.data as Community[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!normalizedQuery) return { profiles: [], posts: [], internships: [], communities: [] };
    return {
      profiles: profiles.filter((item) =>
        searchable([item.full_name, roleLabel[item.role]]).includes(normalizedQuery)
      ),
      posts: posts.filter((item) =>
        searchable([item.title, item.body, item.author_name, categoryLabel[item.category]]).includes(normalizedQuery)
      ),
      internships: internships.filter((item) =>
        searchable([
          item.title,
          item.company_name,
          item.description,
          item.area,
          item.modality,
          item.location,
          item.requirements,
        ]).includes(normalizedQuery)
      ),
      communities: communities.filter((item) =>
        searchable([item.name, item.description]).includes(normalizedQuery)
      ),
    };
  }, [communities, internships, normalizedQuery, posts, profiles]);

  const total =
    results.profiles.length +
    results.posts.length +
    results.internships.length +
    results.communities.length;

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Buscar en PasantIA"
        description={query ? `${total} coincidencias para “${query}”.` : 'Buscá perfiles, publicaciones, pasantías y comunidades.'}
      />

      {!query ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Escribí algo en el buscador"
          description="Los resultados de toda la plataforma van a aparecer acá."
        />
      ) : total === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Sin resultados"
          description="No encontramos coincidencias en perfiles, publicaciones, pasantías ni comunidades."
        />
      ) : (
        <div className="space-y-7">
          {results.profiles.length > 0 && (
            <ResultSection title="Perfiles" icon={<Users className="h-4 w-4" />}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.profiles.map((item) => (
                  <Link key={item.id} to={`/app/explorar?u=${item.id}`}>
                    <Card className="flex h-full items-center gap-3 transition hover:border-brand-400/40">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-500">
                        {initials(item.full_name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">{item.full_name}</span>
                        <span className="block text-xs text-white/45">{roleLabel[item.role]}</span>
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            </ResultSection>
          )}

          {results.posts.length > 0 && (
            <ResultSection title="Publicaciones" icon={<Newspaper className="h-4 w-4" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.posts.map((item) => (
                  <Card key={item.id}>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-brand-500">{categoryLabel[item.category]}</p>
                      <PostActionsMenu
                        post={item}
                        currentUserId={session?.user.id}
                        onDeleted={(postId) => setPosts((current) => current.filter((post) => post.id !== postId))}
                      />
                    </div>
                    {item.title && <h2 className="mt-1 text-base font-semibold text-white">{item.title}</h2>}
                    <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap break-words text-sm text-white/65">
                      <SocialPostText text={item.body} mentions={item.mentions} />
                    </p>
                    <SocialPostImages urls={item.image_urls} />
                    <p className="mt-2 text-xs text-white/40">{item.author_name || 'Usuario'}</p>
                    {item.link_url && <LinkPreview url={item.link_url} className="mt-3" />}
                  </Card>
                ))}
              </div>
            </ResultSection>
          )}

          {results.internships.length > 0 && (
            <ResultSection title="Pasantías" icon={<BriefcaseBusiness className="h-4 w-4" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.internships.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="-mx-3 -mt-3 mb-3 h-28 w-[calc(100%+1.5rem)] object-cover sm:-mx-5 sm:-mt-5 sm:w-[calc(100%+2.5rem)]"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <p className="text-xs text-white/45">{item.company_name || 'Empresa en PasantIA'}</p>
                    <h2 className="mt-1 text-base font-semibold text-white">{item.title}</h2>
                    <p className="mt-1.5 line-clamp-3 text-sm text-white/65">{item.description}</p>
                    <p className="mt-2 text-xs text-white/45">
                      {[item.area, item.modality, item.location].filter(Boolean).join(' · ')}
                    </p>
                    {profile?.role === 'estudiante' && (
                      <Link to="/app/pasantias" className="mt-3 inline-flex text-sm font-semibold text-brand-500">
                        Ver pasantías
                      </Link>
                    )}
                  </Card>
                ))}
              </div>
            </ResultSection>
          )}

          {results.communities.length > 0 && (
            <ResultSection title="Comunidades" icon={<Building2 className="h-4 w-4" />}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.communities.map((item) => (
                  <Link
                    key={item.id}
                    to={profile?.role === 'estudiante' ? `/app/comunidad/${item.id}` : `/comunidad/${item.id}`}
                  >
                    <Card className="h-full transition hover:border-brand-400/40">
                      <h2 className="text-sm font-semibold text-white">{item.name}</h2>
                      {item.description && (
                        <p className="mt-1.5 line-clamp-3 text-sm text-white/60">{item.description}</p>
                      )}
                      <p className="mt-2 text-xs text-white/40">{item.members_count ?? 0} miembros</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/75">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}