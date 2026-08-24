import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Newspaper, UserPlus, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Application, ConnectionRequest, Follow, Post } from '../../lib/database.types';
import { Card } from '../ui/primitives';
import { PostActionsMenu } from '../posts/PostActionsMenu';

interface ActivityItem {
  id: string;
  kind: 'post' | 'application' | 'connection' | 'follow';
  createdAt: string;
  title: string;
  detail?: string;
  post?: Post;
}

function activityDate(value: string) {
  const date = new Date(value);
  const elapsedDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (elapsedDays === 0) return 'Hoy';
  if (elapsedDays === 1) return 'Ayer';
  if (elapsedDays < 7) return `Hace ${elapsedDays} días`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

const activityIcon = {
  post: Newspaper,
  application: BriefcaseBusiness,
  connection: Users,
  follow: UserPlus,
};

export function StudentRecentActivity({ studentId }: { studentId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [postsResult, applicationsResult, connectionsResult, followsResult] = await Promise.all([
        supabase.from('posts').select('*').eq('author_id', studentId).order('created_at', { ascending: false }).limit(8),
        supabase.from('applications').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(8),
        supabase.from('connection_requests').select('*').or(`requester_id.eq.${studentId},recipient_id.eq.${studentId}`).order('created_at', { ascending: false }).limit(8),
        supabase.from('follows').select('*').eq('follower_id', studentId).order('created_at', { ascending: false }).limit(8),
      ]);

      const posts = (postsResult.data ?? []) as Post[];
      const applications = (applicationsResult.data ?? []) as Application[];
      const connections = (connectionsResult.data ?? []) as ConnectionRequest[];
      const follows = (followsResult.data ?? []) as Follow[];
      const internshipIds = [...new Set(applications.map((item) => item.internship_id))];
      const profileIds = [...new Set([
        ...connections.map((item) => item.requester_id === studentId ? item.recipient_id : item.requester_id),
        ...follows.map((item) => item.following_id),
      ])];

      const [internshipsResult, profilesResult] = await Promise.all([
        internshipIds.length ? supabase.from('internships').select('id, title').in('id', internshipIds) : Promise.resolve({ data: [] }),
        profileIds.length ? supabase.from('profiles').select('id, full_name').in('id', profileIds) : Promise.resolve({ data: [] }),
      ]);
      if (!active) return;

      const internshipNames = new Map((internshipsResult.data ?? []).map((item) => [item.id as string, item.title as string]));
      const profileNames = new Map((profilesResult.data ?? []).map((item) => [item.id as string, item.full_name as string]));
      const activity: ActivityItem[] = [
        ...posts.map((post) => ({
          id: `post-${post.id}`,
          kind: 'post' as const,
          createdAt: post.created_at,
          title: 'Publicaste en Inicio',
          detail: post.title || post.body.slice(0, 120),
          post,
        })),
        ...applications.map((application) => ({
          id: `application-${application.id}`,
          kind: 'application' as const,
          createdAt: application.created_at,
          title: 'Te postulaste a una pasantía',
          detail: internshipNames.get(application.internship_id) || 'Pasantía',
        })),
        ...connections.map((connection) => {
          const otherId = connection.requester_id === studentId ? connection.recipient_id : connection.requester_id;
          const sent = connection.requester_id === studentId;
          return {
            id: `connection-${connection.id}`,
            kind: 'connection' as const,
            createdAt: connection.created_at,
            title: connection.status === 'accepted' ? 'Sumaste una conexión' : sent ? 'Enviaste una solicitud' : 'Recibiste una solicitud',
            detail: profileNames.get(otherId) || 'Estudiante',
          };
        }),
        ...follows.map((follow) => ({
          id: `follow-${follow.id}`,
          kind: 'follow' as const,
          createdAt: follow.created_at,
          title: 'Empezaste a seguir un perfil',
          detail: profileNames.get(follow.following_id) || 'Perfil de PasantIA',
        })),
      ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 12);

      setItems(activity);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [studentId]);

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Actividad reciente</h2>
          <p className="mt-0.5 text-xs text-white/45">Publicaciones, conexiones y postulaciones.</p>
        </div>
      </div>
      <Card className="overflow-hidden p-0">
        {loading ? (
          <p className="px-4 py-5 text-sm text-white/50">Cargando actividad…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-5 text-sm text-white/50">Tu actividad va a aparecer acá.</p>
        ) : (
          <div className="divide-y divide-white/8">
            {items.map((item) => {
              const Icon = activityIcon[item.kind];
              return (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/6 text-brand-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white/85">{item.title}</p>
                    {item.detail && <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs text-white/50">{item.detail}</p>}
                    <p className="mt-1 text-[11px] text-white/35">{activityDate(item.createdAt)}</p>
                  </div>
                  {item.post && (
                    <PostActionsMenu
                      post={item.post}
                      currentUserId={studentId}
                      onDeleted={(postId) => setItems((current) => current.filter((entry) => entry.post?.id !== postId))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}