import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Briefcase, Check, MessageSquare, Newspaper, Rocket, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useMessages } from '../messages/MessagesProvider';
import pasantiaLogo from '../../assets/logo.png';

type NotificationKind = 'message' | 'internship' | 'post' | 'admin_post' | 'member' | 'connection' | 'promoter' | 'plan';

interface ActivityNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  createdAt: string;
  targetId?: string;
  avatarUrl?: string | null;
}

const ICONS = {
  message: MessageSquare,
  internship: Briefcase,
  post: Newspaper,
  admin_post: ShieldCheck,
  member: UserPlus,
  connection: UserPlus,
  promoter: Rocket,
  plan: Sparkles,
};

function relativeTime(value: string): string {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60_000));
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export function NotificationCenter() {
  const { profile, refreshProfile } = useAuth();
  const { openMessages } = useMessages();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ActivityNotification[]>([]);
  const [lastSeen, setLastSeen] = useState(0);
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const uid = profile?.id;
  const storageKey = uid ? `pasantia_notifications_seen_${uid}` : '';

  useEffect(() => {
    if (!storageKey) return;
    setLastSeen(Number(localStorage.getItem(storageKey)) || 0);
  }, [storageKey]);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const [messagesResult, internshipsResult, postsResult, membersResult, connectionsResult, promoterRequestsResult, planRequestsResult] = await Promise.all([
        supabase
          .from('messages')
          .select('id, sender_id, content, created_at')
          .eq('recipient_id', uid)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('internships')
          .select('id, title, company_name, created_at')
          .eq('is_active', true)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('posts')
          .select('id, title, body, author_name, created_at, author:profiles!author_id(is_admin)')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('profiles')
          .select('id, full_name, role, created_at')
          .in('role', ['estudiante', 'empresa'])
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('connection_requests')
          .select('id, requester_id, created_at')
          .eq('recipient_id', uid)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('plan_requests')
          .select('id, status, resolved_at')
          .eq('user_id', uid)
          .eq('kind', 'promoter')
          .neq('status', 'pending')
          .gte('resolved_at', since)
          .order('resolved_at', { ascending: false })
          .limit(2),
        supabase
          .from('plan_requests')
          .select('id, requested_plan, status, resolved_at')
          .eq('user_id', uid)
          .eq('kind', 'subscription')
          .neq('status', 'pending')
          .gte('resolved_at', since)
          .order('resolved_at', { ascending: false })
          .limit(2),
      ]);

      const messageRows = (messagesResult.data ?? []) as {
        id: string;
        sender_id: string;
        content: string;
        created_at: string;
      }[];
      const senderIds = [...new Set(messageRows.map((message) => message.sender_id))];
      const senderNames = new Map<string, string>();
      if (senderIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, full_name').in('id', senderIds);
        for (const sender of (data ?? []) as { id: string; full_name: string }[]) {
          senderNames.set(sender.id, sender.full_name);
        }
      }

      const memberRows = (membersResult.data ?? []) as {
        id: string;
        full_name: string;
        role: 'estudiante' | 'empresa';
        created_at: string;
      }[];
      const connectionRows = (connectionsResult.data ?? []) as {
        id: string;
        requester_id: string;
        created_at: string;
      }[];
      const memberIds = memberRows.map((member) => member.id);
      const avatarById = new Map<string, string>();
      if (memberIds.length > 0) {
        const [{ data: students }, { data: companies }] = await Promise.all([
          supabase.from('student_profiles').select('id, avatar_url').in('id', memberIds),
          supabase.from('company_profiles').select('id, avatar_url').in('id', memberIds),
        ]);
        for (const row of [...(students ?? []), ...(companies ?? [])] as {
          id: string;
          avatar_url: string | null;
        }[]) {
          if (row.avatar_url) avatarById.set(row.id, row.avatar_url);
        }
      }

      const requesterNames = new Map<string, string>();
      const requesterAvatars = new Map<string, string>();
      const requesterIds = [...new Set(connectionRows.map((request) => request.requester_id))];
      if (requesterIds.length > 0) {
        const [{ data: profiles }, { data: students }] = await Promise.all([
          supabase.from('profiles').select('id, full_name').in('id', requesterIds),
          supabase.from('student_profiles').select('id, avatar_url').in('id', requesterIds),
        ]);
        for (const row of (profiles ?? []) as { id: string; full_name: string }[]) {
          requesterNames.set(row.id, row.full_name);
        }
        for (const row of (students ?? []) as { id: string; avatar_url: string | null }[]) {
          if (row.avatar_url) requesterAvatars.set(row.id, row.avatar_url);
        }
      }

      const next: ActivityNotification[] = [
        ...messageRows.map((message) => ({
          id: `message-${message.id}`,
          kind: 'message' as const,
          title: `Mensaje de ${senderNames.get(message.sender_id) || 'un usuario'}`,
          detail: message.content,
          createdAt: message.created_at,
        })),
        ...((internshipsResult.data ?? []) as {
          id: string;
          title: string;
          company_name: string | null;
          created_at: string;
        }[]).map((internship) => ({
          id: `internship-${internship.id}`,
          kind: 'internship' as const,
          title: 'Nueva pasantía publicada',
          detail: internship.company_name
            ? `${internship.title} · ${internship.company_name}`
            : internship.title,
          createdAt: internship.created_at,
        })),
        ...((postsResult.data ?? []) as unknown as {
          id: string;
          title: string;
          body: string;
          author_name: string;
          created_at: string;
          author: { is_admin: boolean } | { is_admin: boolean }[] | null;
        }[]).map((post) => {
          const author = Array.isArray(post.author) ? post.author[0] : post.author;
          const isAdminPost = author?.is_admin === true;
          const preview = post.title.trim() || post.body.trim().slice(0, 120) || 'Publicación con imágenes';
          return {
            id: `post-${post.id}`,
            kind: isAdminPost ? 'admin_post' as const : 'post' as const,
            title: isAdminPost ? 'Aviso oficial de PasantIA' : 'Nueva publicación en Novedades',
            detail: isAdminPost ? preview : `${post.author_name}: ${preview}`,
            createdAt: post.created_at,
          };
        }),
        ...memberRows
          .filter((member) => member.id !== uid)
          .map((member) => ({
            id: `member-${member.id}`,
            kind: 'member' as const,
            title: `${member.role === 'empresa' ? 'Nueva empresa' : 'Nuevo estudiante'} en PasantIA`,
            detail: `${member.full_name} se sumó a la plataforma`,
            createdAt: member.created_at,
            targetId: member.id,
            avatarUrl: avatarById.get(member.id) ?? null,
          })),
        ...connectionRows.map((request) => ({
          id: `connection-${request.id}`,
          kind: 'connection' as const,
          title: 'Nueva solicitud de conexión',
          detail: `${requesterNames.get(request.requester_id) || 'Un estudiante'} quiere conectar con vos`,
          createdAt: request.created_at,
          targetId: request.requester_id,
          avatarUrl: requesterAvatars.get(request.requester_id) ?? null,
        })),
        ...((promoterRequestsResult.data ?? []) as { id: string; status: 'approved' | 'rejected'; resolved_at: string }[]).map((request) => ({
          id: `promoter-${request.id}`,
          kind: 'promoter' as const,
          title: request.status === 'approved' ? 'Ya sos promotor/a de PasantIA' : 'Solicitud de promotor revisada',
          detail: request.status === 'approved' ? 'Tu enlace personal ya está habilitado.' : 'Esta vez tu solicitud no fue aprobada.',
          createdAt: request.resolved_at,
        })),
        ...((planRequestsResult.data ?? []) as { id: string; requested_plan: 'pro' | 'enterprise'; status: 'approved' | 'rejected'; resolved_at: string }[]).map((request) => ({
          id: `plan-${request.id}`,
          kind: 'plan' as const,
          title: request.status === 'approved' ? 'Tu plan ya está activo' : 'Solicitud de plan revisada',
          detail: request.status === 'approved'
            ? request.requested_plan === 'pro'
              ? 'Ya tenés activos todos tus beneficios Pro.'
              : 'Ya tenés activos todos los beneficios de tu nuevo plan.'
            : 'Esta vez la solicitud no fue aprobada.',
          createdAt: request.resolved_at,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setItems(next.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30_000);
    const postsChannel = supabase
      .channel(`notification-posts-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        void load();
      })
      .subscribe();
    const plansChannel = supabase
      .channel(`notification-plan-requests-${uid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'plan_requests', filter: `user_id=eq.${uid}` }, (payload) => {
        const request = payload.new as { kind?: string; requested_plan?: string; status?: string };
        if (request.kind === 'subscription' && request.status === 'approved') {
          setPlanNotice(
            request.requested_plan === 'pro'
              ? 'Tu plan Pro ya está activo. Tus beneficios y enlace de promotor ya están habilitados.'
              : 'Tu nuevo plan ya está activo con todos sus beneficios.'
          );
          void refreshProfile();
        }
        void load();
      })
      .subscribe();
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(postsChannel);
      void supabase.removeChannel(plansChannel);
    };
  }, [load, refreshProfile, uid]);

  useEffect(() => {
    if (!planNotice) return;
    const timer = window.setTimeout(() => setPlanNotice(null), 8000);
    return () => window.clearTimeout(timer);
  }, [planNotice]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const unread = items.filter(
    (item) => item.kind === 'message' || new Date(item.createdAt).getTime() > lastSeen
  ).length;

  function markSeen() {
    const now = Date.now();
    localStorage.setItem(storageKey, String(now));
    setLastSeen(now);
  }

  function toggle() {
    setOpen((current) => {
      if (!current) {
        markSeen();
        load();
      }
      return !current;
    });
  }

  function openItem(item: ActivityNotification) {
    setOpen(false);
    if (item.kind === 'message') {
      openMessages();
      return;
    }
    if (item.kind === 'post') navigate('/app/novedades');
    if (item.kind === 'admin_post') {
      navigate(profile?.role === 'estudiante' ? '/app/inicio-estudiante' : '/app/novedades');
    }
    if (item.kind === 'connection') navigate('/app/explorar?tab=red&requests=1');
    if (item.kind === 'promoter') navigate('/app/promotores');
    if (item.kind === 'plan') navigate('/app/planes');
    if (item.kind === 'member') navigate(`/app/explorar?u=${item.targetId}`);
    if (item.kind === 'internship') {
      navigate(
        profile?.role === 'estudiante'
          ? '/app/pasantias'
          : profile?.role === 'embajador'
            ? '/app/anuncios'
            : '/app/mis-pasantias'
      );
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {planNotice && (
        <div className="fixed right-3 top-[calc(env(safe-area-inset-top)+4rem)] z-[70] flex w-[calc(100vw-1.5rem)] max-w-sm items-start gap-3 rounded-xl border border-brand-500/25 bg-white p-4 text-slate-900 shadow-2xl" role="status">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Plan activado</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{planNotice}</p>
          </div>
          <button type="button" onClick={() => setPlanNotice(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar notificación">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Bell className="h-[19px] w-[19px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold !text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="dash-panel fixed right-2 top-[calc(env(safe-area-inset-top)+3.75rem)] z-50 max-h-[min(380px,calc(100dvh-5rem))] w-[calc(100vw-1rem)] max-w-[280px] overflow-hidden rounded-xl border border-white/12 shadow-xl shadow-black/20 sm:absolute sm:right-0 sm:top-full sm:mt-2">
          <div className="flex items-center border-b border-white/10 px-3 py-2.5">
            <div>
              <h2 className="text-[13px] font-semibold text-white">Notificaciones</h2>
              <p className="text-[11px] text-white/45">Actividad reciente de PasantIA</p>
            </div>
            <button
              onClick={markSeen}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-brand-500"
            >
              <Check className="h-3 w-3" /> Vistas
            </button>
          </div>
          <div className="max-h-[min(320px,calc(100dvh-9.5rem))] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-white/45">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-white/45">No hay actividad reciente.</p>
            ) : (
              items.map((item) => {
                const Icon = ICONS[item.kind] ?? UserPlus;
                const isUnread = item.kind === 'message' || new Date(item.createdAt).getTime() > lastSeen;
                return (
                  <button
                    key={item.id}
                    onClick={() => openItem(item)}
                    className={`flex w-full gap-2.5 border-b border-white/[0.07] px-3 py-2.5 text-left transition hover:bg-white/[0.05] ${
                      isUnread ? 'bg-brand-500/[0.06]' : ''
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500/10 text-brand-500">
                      {item.kind === 'admin_post' ? (
                        <img
                          src={pasantiaLogo}
                          alt="PasantIA"
                          className="h-full w-full object-cover"
                        />
                      ) : item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold leading-snug text-white">{item.title}</span>
                      <span className="mt-0.5 block line-clamp-2 text-[11px] leading-relaxed text-white/55">
                        {item.detail}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-brand-500">
                        {relativeTime(item.createdAt)}
                      </span>
                    </span>
                    {isUnread && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}