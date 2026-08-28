// Mensajería directa estilo LinkedIn: panel desplegable abajo a la derecha.
// Provee un contexto para abrir un chat con alguien desde cualquier parte del panel.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Send,
  X,
  Plus,
  Search,
  UserPlus,
  Users,
  Camera,
  Check,
  Pencil,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendPushEvent } from '../../lib/notify';
import { isPro } from '../../lib/plans';
import { useAuth } from '../auth/AuthProvider';
import { useAnyModalOpen } from '../ui/modalGuard';
import { planRestriction, restrictionFromError } from '../../lib/planRestrictions';

interface MessagesContextValue {
  openChatWith: (userId: string, name: string, avatar?: string | null) => void;
  openMessages: () => void;
  shareContacts: SuggestedContact[];
  shareContactsLoading: boolean;
  loadShareContacts: () => void;
  shareWith: (userId: string, content: string) => Promise<string | null>;
  connectForSharing: (userId: string, state: SuggestedContact['connectionState']) => Promise<string | null>;
  unreadTotal: number;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function useMessages(): MessagesContextValue {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages debe usarse dentro de <MessagesProvider>');
  return ctx;
}

/** Botón para abrir el panel de mensajes (ej: en la barra superior en mobile). */
export function MessagesButton({ className = '' }: { className?: string }) {
  const { openMessages, unreadTotal } = useMessages();
  return (
    <button
      onClick={openMessages}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white ${className}`}
      title="Mensajes"
      aria-label="Mensajes"
    >
      <MessageSquare className="h-[19px] w-[19px]" />
      {unreadTotal > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold !text-white">
          {unreadTotal}
        </span>
      )}
    </button>
  );
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  otherId: string;
  name: string;
  avatar: string | null;
  last: string;
  lastAt: string;
  unread: number;
}

export interface SuggestedContact {
  id: string;
  name: string;
  avatar: string | null;
  role: 'estudiante' | 'empresa' | 'embajador';
  canMessage: boolean;
  connectionState: 'none' | 'sent' | 'received' | 'connected' | 'unavailable';
}

interface MessageGroup {
  id: string;
  name: string;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
}

interface GroupConversation extends MessageGroup {
  last: string;
  lastAt: string;
  unread: number;
}

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  senderName?: string;
}

interface GroupMember {
  id: string;
  name: string;
  avatar: string | null;
  isAdmin: boolean;
}

type ComposerMode = 'menu' | 'contact' | 'group' | null;

const suggestedRoleLabel: Record<SuggestedContact['role'], string> = {
  estudiante: 'Estudiante',
  empresa: 'Empresa',
  embajador: 'Comunidad',
};

type EmbeddedProfile = { full_name: string } | Array<{ full_name: string }> | null;

function embeddedProfileName(profile: EmbeddedProfile): string {
  return (Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name) || '';
}

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function ChatAvatar({
  url,
  name,
  className = 'h-9 w-9',
}: {
  url: string | null | undefined;
  name: string;
  className?: string;
}) {
  return url ? (
    <img
      src={url}
      alt={name}
      className={`${className} shrink-0 rounded-full border border-white/12 object-cover`}
    />
  ) : (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white`}
    >
      {initials(name)}
    </span>
  );
}

function timeShort(d: string): string {
  try {
    return new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function ContactList({
  contacts,
  loading,
  onPick,
}: {
  contacts: SuggestedContact[];
  loading: boolean;
  onPick: (contact: SuggestedContact) => void;
}) {
  if (loading) return <p className="py-6 text-center text-xs text-white/40">Buscando perfiles…</p>;
  if (contacts.length === 0) return <p className="py-6 text-center text-xs text-white/45">No encontramos contactos.</p>;
  return (
    <div className="max-h-64 space-y-1 overflow-y-auto">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          type="button"
          onClick={() => onPick(contact)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.06]"
        >
          <ChatAvatar url={contact.avatar} name={contact.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{contact.name}</span>
            <span className="block text-[11px] text-white/45">{suggestedRoleLabel[contact.role]}</span>
          </span>
          <MessageSquare className="h-4 w-4 shrink-0 text-brand-500" />
        </button>
      ))}
    </div>
  );
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const uid = session?.user.id;
  const navigate = useNavigate();
  const companyMessagingLocked = profile?.role === 'empresa' && !isPro(profile);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [activeGroup, setActiveGroup] = useState<MessageGroup | null>(null);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [groupConvos, setGroupConvos] = useState<GroupConversation[]>([]);
  const [thread, setThread] = useState<Message[]>([]);
  const [groupThread, setGroupThread] = useState<GroupMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [upgradeNotice, setUpgradeNotice] = useState<'student' | 'company' | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedContact[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>(null);
  const [contactQuery, setContactQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [groupAdminError, setGroupAdminError] = useState<string | null>(null);
  const [updatingGroupAvatar, setUpdatingGroupAvatar] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState('');
  const [updatingGroupName, setUpdatingGroupName] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [mobileViewport, setMobileViewport] = useState<{ height: number; top: number } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const suggestionsLoadedRef = useRef(false);

  const loadSuggestions = useCallback(async () => {
    if (!uid || suggestionsLoadedRef.current) return;
    suggestionsLoadedRef.current = true;
    setLoadingSuggestions(true);
    try {
      const [{ data: students }, { data: companies }, { data: ambassadors }] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('id, avatar_url, profile:profiles(full_name)')
          .eq('is_public', true)
          .limit(100),
        supabase
          .from('company_profiles')
          .select('id, avatar_url, company_name, profile:profiles(full_name)')
          .limit(100),
        supabase
          .from('ambassador_profiles')
          .select('id, logo_url, org_name, profile:profiles(full_name)')
          .limit(100),
      ]);

      const unrestricted = profile?.role === 'embajador' || isPro(profile);
      const contacts: SuggestedContact[] = [];
      for (const row of (students as unknown as Array<{
        id: string;
        avatar_url: string | null;
        profile: EmbeddedProfile;
      }>) ?? []) {
        if (row.id !== uid) {
          contacts.push({
            id: row.id,
            name: embeddedProfileName(row.profile) || 'Estudiante',
            avatar: row.avatar_url,
            role: 'estudiante',
            canMessage: unrestricted,
            connectionState: unrestricted ? 'connected' : 'none',
          });
        }
      }
      for (const row of (companies as unknown as Array<{
        id: string;
        avatar_url: string | null;
        company_name: string | null;
        profile: EmbeddedProfile;
      }>) ?? []) {
        if (row.id !== uid) {
          contacts.push({
            id: row.id,
            name: row.company_name || embeddedProfileName(row.profile) || 'Empresa',
            avatar: row.avatar_url,
            role: 'empresa',
            canMessage: unrestricted,
            connectionState: unrestricted ? 'connected' : 'unavailable',
          });
        }
      }
      for (const row of (ambassadors as unknown as Array<{
        id: string;
        logo_url: string | null;
        org_name: string | null;
        profile: EmbeddedProfile;
      }>) ?? []) {
        if (row.id !== uid) {
          contacts.push({
            id: row.id,
            name: row.org_name || embeddedProfileName(row.profile) || 'Comunidad',
            avatar: row.logo_url,
            role: 'embajador',
            canMessage: unrestricted,
            connectionState: unrestricted ? 'connected' : 'unavailable',
          });
        }
      }
      let eligibleContacts = contacts;
      if (!unrestricted) {
        const [{ data: directMessages }, { data: follows }, { data: connectionRequests }] = await Promise.all([
          supabase
            .from('messages')
            .select('sender_id, recipient_id')
            .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
            .limit(500),
          profile?.role === 'estudiante'
            ? supabase
                .from('follows')
                .select('follower_id, following_id')
                .or(`follower_id.eq.${uid},following_id.eq.${uid}`)
            : Promise.resolve({ data: [] }),
            profile?.role === 'estudiante'
            ? supabase
              .from('connection_requests')
              .select('requester_id, recipient_id, status')
              .eq('status', 'pending')
              .or(`requester_id.eq.${uid},recipient_id.eq.${uid}`)
            : Promise.resolve({ data: [] }),
        ]);
        const allowedIds = new Set<string>();
        for (const message of (directMessages ?? []) as Array<{ sender_id: string; recipient_id: string }>) {
          allowedIds.add(message.sender_id === uid ? message.recipient_id : message.sender_id);
        }
        if (profile?.role === 'estudiante') {
          const outgoing = new Set<string>();
          const incoming = new Set<string>();
          for (const follow of (follows ?? []) as Array<{ follower_id: string; following_id: string }>) {
            if (follow.follower_id === uid) outgoing.add(follow.following_id);
            if (follow.following_id === uid) incoming.add(follow.follower_id);
          }
          for (const id of outgoing) if (incoming.has(id)) allowedIds.add(id);
        }
        const requestState = new Map<string, SuggestedContact['connectionState']>();
        for (const request of (connectionRequests ?? []) as Array<{
          requester_id: string;
          recipient_id: string;
          status: string;
        }>) {
          const otherId = request.requester_id === uid ? request.recipient_id : request.requester_id;
          requestState.set(otherId, request.requester_id === uid ? 'sent' : 'received');
        }
        eligibleContacts = contacts.map((contact) => {
          if (allowedIds.has(contact.id)) {
            return { ...contact, canMessage: true, connectionState: 'connected' };
          }
          if (profile?.role === 'estudiante' && contact.role === 'estudiante') {
            return { ...contact, connectionState: requestState.get(contact.id) ?? 'none' };
          }
          return contact;
        });
      }
      const priority: Record<SuggestedContact['role'], number> =
        profile?.role === 'empresa'
          ? { estudiante: 0, embajador: 1, empresa: 2 }
          : profile?.role === 'embajador'
            ? { empresa: 0, estudiante: 1, embajador: 2 }
            : { empresa: 0, embajador: 1, estudiante: 2 };
      const roleOrder = (Object.keys(priority) as SuggestedContact['role'][]).sort(
        (a, b) => priority[a] - priority[b]
      );
      const balanced = roleOrder.flatMap((role) =>
        eligibleContacts.filter((contact) => contact.role === role)
      );
      setSuggestions(balanced);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [uid, profile?.role, profile?.plan, profile?.plan_expires_at]);

  useEffect(() => {
    suggestionsLoadedRef.current = false;
    setSuggestions([]);
  }, [uid, profile?.role, profile?.plan, profile?.plan_expires_at]);

  const loadConversations = useCallback(async () => {
    if (!uid) return;
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false })
        .limit(300);
      const msgs = (data as Message[]) ?? [];

      const map = new Map<string, Conversation>();
      for (const m of msgs) {
        const otherId = m.sender_id === uid ? m.recipient_id : m.sender_id;
        const isUnread = m.recipient_id === uid && !m.read;
        const existing = map.get(otherId);
        if (!existing) {
          map.set(otherId, {
            otherId,
            name: otherId,
            avatar: null,
            last: m.content,
            lastAt: m.created_at,
            unread: isUnread ? 1 : 0,
          });
        } else if (isUnread) {
          existing.unread += 1;
        }
      }

      const others = Array.from(map.keys());
      if (others.length > 0) {
        const [{ data: profs }, { data: st }, { data: co }, { data: am }] = await Promise.all([
          supabase.from('profiles').select('id, full_name').in('id', others),
          supabase.from('student_profiles').select('id, avatar_url').in('id', others),
          supabase.from('company_profiles').select('id, avatar_url').in('id', others),
          supabase.from('ambassador_profiles').select('id, logo_url').in('id', others),
        ]);
        for (const p of (profs as { id: string; full_name: string }[]) ?? []) {
          const c = map.get(p.id);
          if (c) c.name = p.full_name || 'Usuario';
        }
        const avatarById = new Map<string, string | null>();
        for (const r of (st as { id: string; avatar_url: string | null }[]) ?? [])
          if (r.avatar_url) avatarById.set(r.id, r.avatar_url);
        for (const r of (co as { id: string; avatar_url: string | null }[]) ?? [])
          if (r.avatar_url) avatarById.set(r.id, r.avatar_url);
        for (const r of (am as { id: string; logo_url: string | null }[]) ?? [])
          if (r.logo_url) avatarById.set(r.id, r.logo_url);
        for (const [id, url] of avatarById) {
          const c = map.get(id);
          if (c) c.avatar = url;
        }
      }
      setConvos(Array.from(map.values()));
    } catch {
      /* tabla no creada aún: dejar vacío */
    }
  }, [uid]);

  const loadGroups = useCallback(async () => {
    if (!uid) return;
    try {
      const { data: memberships, error } = await supabase
        .from('message_group_members')
        .select('group_id, last_read_at, group:message_groups(id, name, avatar_url, created_by, created_at)')
        .eq('user_id', uid);
      if (error) {
        if (/does not exist|schema cache|relation/i.test(error.message)) setGroupConvos([]);
        return;
      }
      const rows = (memberships ?? []) as unknown as Array<{
        group_id: string;
        last_read_at: string;
        group: MessageGroup | MessageGroup[] | null;
      }>;
      const groupIds = rows.map((row) => row.group_id);
      if (groupIds.length === 0) {
        setGroupConvos([]);
        return;
      }
      const { data: messages } = await supabase
        .from('group_messages')
        .select('id, group_id, sender_id, content, created_at')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .limit(500);
      const messageRows = (messages as GroupMessage[] | null) ?? [];
      const next = rows.flatMap((row) => {
        const group = Array.isArray(row.group) ? row.group[0] : row.group;
        if (!group) return [];
        const groupMessages = messageRows.filter((message) => message.group_id === row.group_id);
        const last = groupMessages[0];
        const lastRead = new Date(row.last_read_at).getTime();
        return [{
          ...group,
          last: last?.content ?? 'Grupo creado',
          lastAt: last?.created_at ?? group.created_at,
          unread: groupMessages.filter(
            (message) => message.sender_id !== uid && new Date(message.created_at).getTime() > lastRead
          ).length,
        }];
      });
      setGroupConvos(next.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()));
    } catch {
      setGroupConvos([]);
    }
  }, [uid]);

  const loadThread = useCallback(
    async (otherId: string) => {
      if (!uid) return;
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${uid},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${uid})`
          )
          .order('created_at', { ascending: true })
          .limit(300);
        setThread((data as Message[]) ?? []);
        // marcar como leídos los recibidos
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('recipient_id', uid)
          .eq('sender_id', otherId)
          .eq('read', false);
      } catch {
        setThread([]);
      }
    },
    [uid]
  );

  const loadGroupThread = useCallback(
    async (groupId: string) => {
      if (!uid) return;
      try {
        const { data } = await supabase
          .from('group_messages')
          .select('id, group_id, sender_id, content, created_at')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })
          .limit(500);
        const rows = (data as GroupMessage[] | null) ?? [];
        const senderIds = [...new Set(rows.map((row) => row.sender_id))];
        const names = new Map<string, string>();
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', senderIds);
          for (const sender of (profiles ?? []) as { id: string; full_name: string }[]) {
            names.set(sender.id, sender.full_name || 'Usuario');
          }
        }
        setGroupThread(rows.map((row) => ({ ...row, senderName: names.get(row.sender_id) || 'Usuario' })));
        await supabase.rpc('mark_message_group_read', { p_group_id: groupId });
        setGroupConvos((current) => current.map((group) => group.id === groupId ? { ...group, unread: 0 } : group));
      } catch {
        setGroupThread([]);
      }
    },
    [uid]
  );

  const openChatWith = useCallback(
    (userId: string, name: string, avatar: string | null = null) => {
      if (userId === uid) return;
      setUpgradeNotice(null);
      setActiveGroup(null);
      setGroupSettingsOpen(false);
      setActive({ id: userId, name, avatar });
      setOpen(true);
      loadThread(userId);
    },
    [uid, loadThread]
  );

  const openMessages = useCallback(() => {
    setOpen(true);
    loadConversations();
    loadGroups();
  }, [loadConversations, loadGroups]);

  const shareWith = useCallback(async (userId: string, content: string): Promise<string | null> => {
    if (!uid || userId === uid || !content.trim()) return 'No se pudo preparar el envío.';
    if (companyMessagingLocked) return planRestriction('company_messages').message;
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({ sender_id: uid, recipient_id: userId, content: content.trim() })
        .select('id')
        .single();
      if (error || !message) throw error ?? new Error('No se creó el mensaje');
      void sendPushEvent('message', message.id);
      void loadConversations();
      return null;
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : error instanceof Error
            ? error.message
            : '';
      if (/row-level security|policy|not authorized|permission denied/i.test(message)) {
        return 'Solo podés enviar a conversaciones o contactos habilitados por tu plan.';
      }
      if (/messages|does not exist|relation|schema cache/i.test(message)) {
        return 'La mensajería todavía no está disponible.';
      }
      return message ? `No se pudo enviar: ${message}` : 'No se pudo enviar. Intentá nuevamente.';
    }
  }, [uid, loadConversations, companyMessagingLocked]);

  const connectForSharing = useCallback(async (
    userId: string,
    state: SuggestedContact['connectionState']
  ): Promise<string | null> => {
    if (!uid || profile?.role !== 'estudiante') {
      return 'Las conexiones están disponibles entre estudiantes.';
    }
    if (state === 'sent') return 'La solicitud ya fue enviada. Podrás compartir cuando la acepten.';
    try {
      if (state === 'received') {
        const { data: requests, error: requestError } = await supabase
          .from('connection_requests')
          .select('id')
          .eq('requester_id', userId)
          .eq('recipient_id', uid)
          .eq('status', 'pending')
          .limit(1);
        if (requestError || !requests?.[0]) throw requestError ?? new Error('Solicitud no disponible');
        const { error } = await supabase.rpc('respond_connection_request', {
          p_request_id: requests[0].id,
          p_accept: true,
        });
        if (error) throw error;
        void sendPushEvent('connection_accepted', requests[0].id);
      } else {
        const { data, error } = await supabase.rpc('request_connection', { p_recipient_id: userId });
        if (error) throw error;
        void sendPushEvent('connection_request', String(data));
      }
      suggestionsLoadedRef.current = false;
      await loadSuggestions();
      return null;
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
      const restriction = restrictionFromError(error);
      if (restriction?.code === 'student_connections') {
        return `${restriction.title}. ${restriction.message}`;
      }
      if (/does not exist|schema cache|function/i.test(message)) {
        return 'Las solicitudes de conexión todavía no están disponibles.';
      }
      return 'No se pudo actualizar la conexión. Intentá nuevamente.';
    }
  }, [uid, profile?.role, loadSuggestions]);

  const openGroup = useCallback((group: MessageGroup) => {
    setActive(null);
    setActiveGroup(group);
    setGroupSettingsOpen(false);
    setComposerMode(null);
    setOpen(true);
    void loadGroupThread(group.id);
  }, [loadGroupThread]);

  const loadGroupMembers = useCallback(async (groupId: string) => {
    setLoadingGroupMembers(true);
    setGroupAdminError(null);
    try {
      const { data: memberships, error } = await supabase
        .from('message_group_members')
        .select('user_id, is_admin')
        .eq('group_id', groupId);
      if (error) throw error;
      const rows = (memberships ?? []) as Array<{ user_id: string; is_admin: boolean }>;
      const memberIds = rows.map((row) => row.user_id);
      if (memberIds.length === 0) {
        setGroupMembers([]);
        return;
      }
      const [{ data: profiles }, { data: students }, { data: companies }, { data: ambassadors }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', memberIds),
        supabase.from('student_profiles').select('id, avatar_url').in('id', memberIds),
        supabase.from('company_profiles').select('id, avatar_url').in('id', memberIds),
        supabase.from('ambassador_profiles').select('id, logo_url').in('id', memberIds),
      ]);
      const names = new Map((profiles ?? []).map((item) => [item.id, item.full_name || 'Usuario']));
      const avatars = new Map<string, string>();
      for (const item of [...(students ?? []), ...(companies ?? [])] as Array<{ id: string; avatar_url: string | null }>) {
        if (item.avatar_url) avatars.set(item.id, item.avatar_url);
      }
      for (const item of (ambassadors ?? []) as Array<{ id: string; logo_url: string | null }>) {
        if (item.logo_url) avatars.set(item.id, item.logo_url);
      }
      setGroupMembers(rows.map((row) => ({
        id: row.user_id,
        name: names.get(row.user_id) || 'Usuario',
        avatar: avatars.get(row.user_id) ?? null,
        isAdmin: row.is_admin,
      })));
    } catch {
      setGroupAdminError('No se pudieron cargar los integrantes.');
    } finally {
      setLoadingGroupMembers(false);
    }
  }, []);

  function openGroupSettings() {
    if (!activeGroup) return;
    setGroupSettingsOpen(true);
    setEditingGroupName(false);
    setGroupNameDraft(activeGroup.name);
    void loadGroupMembers(activeGroup.id);
  }

  async function saveGroupName() {
    const nextName = groupNameDraft.trim();
    if (!activeGroup || updatingGroupName) return;
    if (nextName.length < 2 || nextName.length > 80) {
      setGroupAdminError('El nombre debe tener entre 2 y 80 caracteres.');
      return;
    }
    if (nextName === activeGroup.name) {
      setEditingGroupName(false);
      return;
    }
    setUpdatingGroupName(true);
    setGroupAdminError(null);
    const groupId = activeGroup.id;
    const { error } = await supabase.rpc('update_message_group_name', {
      p_group_id: groupId,
      p_name: nextName,
    });
    if (error) {
      setGroupAdminError('No se pudo cambiar el nombre del grupo.');
    } else {
      setActiveGroup((current) => current ? { ...current, name: nextName } : current);
      setGroupConvos((current) => current.map((group) => group.id === groupId ? { ...group, name: nextName } : group));
      setEditingGroupName(false);
    }
    setUpdatingGroupName(false);
  }

  async function changeGroupAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeGroup || !uid || updatingGroupAvatar) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setGroupAdminError('Elegí una imagen JPG, PNG o WEBP de hasta 5 MB.');
      return;
    }
    setUpdatingGroupAvatar(true);
    setGroupAdminError(null);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `message-groups/${uid}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('cvs').upload(path, file);
      if (uploadError) throw uploadError;
      const avatarUrl = supabase.storage.from('cvs').getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.rpc('update_message_group_avatar', {
        p_group_id: activeGroup.id,
        p_avatar_url: avatarUrl,
      });
      if (error) throw error;
      setActiveGroup((current) => current ? { ...current, avatar_url: avatarUrl } : current);
      setGroupConvos((current) => current.map((group) => group.id === activeGroup.id ? { ...group, avatar_url: avatarUrl } : group));
    } catch {
      setGroupAdminError('No se pudo cambiar la imagen del grupo.');
    } finally {
      setUpdatingGroupAvatar(false);
    }
  }

  async function removeGroupMember(memberId: string) {
    if (!activeGroup || removingMemberId) return;
    setRemovingMemberId(memberId);
    setGroupAdminError(null);
    const { error } = await supabase.rpc('remove_message_group_member', {
      p_group_id: activeGroup.id,
      p_member_id: memberId,
    });
    if (error) {
      setGroupAdminError(error.message.includes('dos integrantes')
        ? 'El grupo debe conservar al menos dos integrantes.'
        : 'No se pudo quitar al integrante.');
    } else {
      setGroupMembers((current) => current.filter((member) => member.id !== memberId));
    }
    setRemovingMemberId(null);
  }

  function resetComposer() {
    setComposerMode(null);
    setContactQuery('');
    setGroupName('');
    setGroupAvatarFile(null);
    setGroupAvatarPreview('');
    setSelectedMemberIds(new Set());
    setGroupError(null);
  }

  function handleGroupAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setGroupError('Elegí una imagen JPG, PNG o WEBP de hasta 5 MB.');
      return;
    }
    setGroupAvatarFile(file);
    setGroupError(null);
    const reader = new FileReader();
    reader.onload = () => setGroupAvatarPreview(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  }

  async function createGroup() {
    if (!uid || groupName.trim().length < 2 || selectedMemberIds.size < 1 || creatingGroup) return;
    setCreatingGroup(true);
    setGroupError(null);
    try {
      let avatarUrl: string | null = null;
      if (groupAvatarFile) {
        const ext = groupAvatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `message-groups/${uid}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('cvs').upload(path, groupAvatarFile);
        if (uploadError) throw uploadError;
        avatarUrl = supabase.storage.from('cvs').getPublicUrl(path).data.publicUrl;
      }
      const { data: groupId, error } = await supabase.rpc('create_message_group', {
        p_name: groupName.trim(),
        p_avatar_url: avatarUrl,
        p_member_ids: [...selectedMemberIds],
      });
      if (error || !groupId) throw error ?? new Error('No se creó el grupo');
      const group: MessageGroup = {
        id: String(groupId),
        name: groupName.trim(),
        avatar_url: avatarUrl,
        created_by: uid,
        created_at: new Date().toISOString(),
      };
      resetComposer();
      await loadGroups();
      openGroup(group);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setGroupError(
        /does not exist|schema cache|function|relation/i.test(message)
          ? 'Falta ejecutar la migración de grupos en Supabase.'
          : 'No se pudo crear el grupo. Intentá nuevamente.'
      );
    } finally {
      setCreatingGroup(false);
    }
  }

  function goToProfile(userId: string) {
    navigate(`/app/explorar?u=${encodeURIComponent(userId)}`);
    setOpen(false);
  }

  async function handleSend() {
    if (!text.trim() || (!active && !activeGroup) || !uid) return;
    if (!activeGroup && companyMessagingLocked) {
      setUpgradeNotice('company');
      return;
    }
    setSending(true);
    try {
      if (activeGroup) {
        const { data: message, error } = await supabase
          .from('group_messages')
          .insert({ group_id: activeGroup.id, sender_id: uid, content: text.trim() })
          .select('id')
          .single();
        if (error || !message) throw error ?? new Error('No se creó el mensaje');
        void sendPushEvent('group_message', message.id);
        setText('');
        await loadGroupThread(activeGroup.id);
        void loadGroups();
        return;
      }
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          sender_id: uid,
          recipient_id: active!.id,
          content: text.trim(),
        })
        .select('id')
        .single();
      if (error || !message) throw error ?? new Error('No se creó el mensaje');
      // Notificación push al destinatario (best-effort, no bloquea el envío).
      void sendPushEvent('message', message.id);
      setText('');
      await loadThread(active!.id);
      loadConversations();
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (activeGroup && /group_messages|message_group|does not exist|relation|schema cache|function/i.test(msg)) {
        alert('Falta crear las tablas de grupos. Ejecutá supabase/migracion-mensajes-grupos.sql en Supabase.');
      } else if (/row-level security|policy|not authorized|permission denied/i.test(msg)) {
        setUpgradeNotice(profile?.role === 'estudiante' ? 'student' : 'company');
      } else if (/messages|does not exist|relation|schema cache/i.test(msg)) {
        alert(
          'Falta crear la tabla de mensajes.\nEjecutá supabase/migracion-mensajes.sql en el SQL Editor de Supabase.'
        );
      } else {
        alert('No se pudo enviar el mensaje: ' + msg);
      }
    } finally {
      setSending(false);
    }
  }

  // Carga inicial + polling del badge de no leídos.
  useEffect(() => {
    if (!uid) return;
    loadConversations();
    loadGroups();
    const t = setInterval(() => {
      void loadConversations();
      void loadGroups();
    }, 8000);
    return () => clearInterval(t);
  }, [uid, loadConversations, loadGroups]);

  useEffect(() => {
    suggestionsLoadedRef.current = false;
    setSuggestions([]);
  }, [uid]);

  useEffect(() => {
    if (!open || !window.visualViewport) {
      setMobileViewport(null);
      return;
    }
    const viewport = window.visualViewport;
    const syncViewport = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        setMobileViewport(null);
        return;
      }
      setMobileViewport({ height: Math.round(viewport.height), top: Math.round(viewport.offsetTop) });
    };
    syncViewport();
    viewport.addEventListener('resize', syncViewport);
    viewport.addEventListener('scroll', syncViewport);
    return () => {
      viewport.removeEventListener('resize', syncViewport);
      viewport.removeEventListener('scroll', syncViewport);
    };
  }, [open]);

  useEffect(() => {
    if (open && !active && !activeGroup) loadSuggestions();
  }, [open, active, activeGroup, loadSuggestions]);

  // Polling del hilo abierto.
  useEffect(() => {
    if (!open || !active) return;
    const t = setInterval(() => loadThread(active.id), 5000);
    return () => clearInterval(t);
  }, [open, active, loadThread]);

  useEffect(() => {
    if (!open || !activeGroup) return;
    const t = setInterval(() => loadGroupThread(activeGroup.id), 5000);
    return () => clearInterval(t);
  }, [open, activeGroup, loadGroupThread]);

  // Auto-scroll al final del hilo.
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [thread, groupThread, active, activeGroup, open]);

  const unreadTotal = useMemo(
    () => convos.reduce((sum, conversation) => sum + conversation.unread, 0) +
      groupConvos.reduce((sum, group) => sum + group.unread, 0),
    [convos, groupConvos]
  );
  const filteredContacts = useMemo(() => {
    const query = contactQuery.trim().toLowerCase();
    return suggestions.filter((contact) => !query || contact.name.toLowerCase().includes(query));
  }, [suggestions, contactQuery]);
  const combinedConversations = useMemo(
    () => [
      ...convos.map((conversation) => ({ kind: 'direct' as const, item: conversation, at: conversation.lastAt })),
      ...groupConvos.map((group) => ({ kind: 'group' as const, item: group, at: group.lastAt })),
    ].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime()),
    [convos, groupConvos]
  );
  const value = useMemo(
    () => ({
      openChatWith,
      openMessages,
      shareContacts: suggestions,
      shareContactsLoading: loadingSuggestions,
      loadShareContacts: loadSuggestions,
      shareWith,
      connectForSharing,
      unreadTotal,
    }),
    [openChatWith, openMessages, suggestions, loadingSuggestions, loadSuggestions, shareWith, connectForSharing, unreadTotal]
  );
  const modalOpen = useAnyModalOpen();
  const activeGroupAdmin = groupMembers.some((member) => member.id === uid && member.isAdmin);
  const mobileKeyboardOpen = mobileViewport
    ? mobileViewport.height < window.innerHeight - 120
    : false;

  return (
    <MessagesContext.Provider value={value}>
      {children}

      {uid && !modalOpen && (
        <div
          style={mobileViewport ? { height: mobileViewport.height, top: mobileViewport.top } : undefined}
          className={
            open
              ? `fixed left-0 top-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--dash-panel)] lg:inset-auto lg:bottom-0 lg:right-4 lg:block lg:h-auto lg:w-[320px] lg:bg-transparent ${mobileKeyboardOpen ? 'messages-keyboard-cover' : ''}`
              : 'hidden lg:fixed lg:bottom-0 lg:right-4 lg:z-50 lg:block lg:w-[320px]'
          }
        >
          <div className="dash-panel flex h-full min-h-0 flex-col overflow-hidden rounded-none border-x-0 border-t border-white/12 pt-[env(safe-area-inset-top)] shadow-2xl shadow-black/40 lg:h-auto lg:rounded-t-2xl lg:border-x lg:border-b-0 lg:pt-0">
            {/* Header */}
            <div className="flex w-full items-center gap-2 px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-3">
              <button
                onClick={() => {
                  setOpen((value) => !value);
                  if (!open) {
                    void loadConversations();
                    void loadGroups();
                  }
                }}
                className="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-2.5"
              >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/15 text-brand-300 sm:h-8 sm:w-8">
                <MessageSquare className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
              <span className="flex-1 whitespace-nowrap text-[13px] font-semibold text-white sm:text-sm">Mensajes</span>
              {unreadTotal > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold !text-white">
                  {unreadTotal}
                </span>
              )}
              {open ? (
                <ChevronDown className="h-4 w-4 text-white/50" />
              ) : (
                <ChevronUp className="h-4 w-4 text-white/50" />
              )}
              </button>
              {open && !active && !activeGroup && (
                <button
                  type="button"
                  onClick={() => setComposerMode((mode) => mode ? null : 'menu')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
                  aria-label={composerMode ? 'Cerrar nueva conversación' : 'Nueva conversación'}
                  title={composerMode ? 'Cerrar' : 'Nueva conversación'}
                >
                  {composerMode ? <X className="h-[18px] w-[18px]" /> : <Plus className="h-[18px] w-[18px]" />}
                </button>
              )}
            </div>

            {open && (
              <div className="flex min-h-0 flex-1 flex-col border-t border-white/10 lg:block lg:flex-none">
                {active || activeGroup ? (
                  /* ── Hilo ── */
                  <div className="flex h-full min-h-0 flex-col lg:h-[380px]">
                    <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                      <button
                        onClick={() => {
                          if (groupSettingsOpen) {
                            setGroupSettingsOpen(false);
                            return;
                          }
                          setActive(null);
                          setActiveGroup(null);
                          setText('');
                        }}
                        className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
                        aria-label="Volver"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      {active ? (
                        <button
                          onClick={() => goToProfile(active.id)}
                          className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-white/10"
                          title={`Ver perfil de ${active.name}`}
                        >
                          <ChatAvatar url={active.avatar} name={active.name} className="h-7 w-7" />
                          <span className="truncate text-sm font-semibold text-white">{active.name}</span>
                        </button>
                      ) : activeGroup ? (
                        <button
                          type="button"
                          onClick={openGroupSettings}
                          className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-white/10"
                          title="Información del grupo"
                        >
                          <ChatAvatar url={activeGroup.avatar_url} name={activeGroup.name} className="h-7 w-7" />
                          <span className="truncate text-sm font-semibold text-white">{activeGroup.name}</span>
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setActive(null);
                          setActiveGroup(null);
                          setGroupSettingsOpen(false);
                        }}
                        className="ml-auto rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
                        aria-label="Cerrar chat"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {activeGroup && groupSettingsOpen ? (
                      <div className="flex-1 overflow-y-auto px-3 py-4">
                        <div className="text-center">
                          <div className="relative mx-auto h-20 w-20">
                            <ChatAvatar url={activeGroup.avatar_url} name={activeGroup.name} className="h-20 w-20" />
                            {activeGroupAdmin && (
                              <label
                                className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-brand-500 text-white shadow-lg"
                                title="Cambiar imagen"
                              >
                                <Camera className="h-4 w-4" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={changeGroupAvatar}
                                  disabled={updatingGroupAvatar}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                          {editingGroupName ? (
                            <div className="mx-auto mt-3 max-w-[15rem]">
                              <input
                                value={groupNameDraft}
                                onChange={(event) => setGroupNameDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') void saveGroupName();
                                  if (event.key === 'Escape') setEditingGroupName(false);
                                }}
                                maxLength={80}
                                autoFocus
                                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-center text-base font-semibold text-white outline-none focus:border-brand-400/60"
                                aria-label="Nombre del grupo"
                              />
                              <div className="mt-2 flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingGroupName(false)}
                                  disabled={updatingGroupName}
                                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/8"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void saveGroupName()}
                                  disabled={updatingGroupName || groupNameDraft.trim().length < 2}
                                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                                >
                                  {updatingGroupName ? 'Guardando…' : 'Guardar'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 flex items-center justify-center gap-1">
                              <h3 className="min-w-0 truncate text-base font-semibold text-white">{activeGroup.name}</h3>
                              {activeGroupAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGroupNameDraft(activeGroup.name);
                                    setEditingGroupName(true);
                                    setGroupAdminError(null);
                                  }}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                                  title="Cambiar nombre"
                                  aria-label="Cambiar nombre del grupo"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                          <p className="mt-0.5 text-xs text-white/45">
                            {loadingGroupMembers ? 'Cargando integrantes…' : `${groupMembers.length} integrantes`}
                          </p>
                          {updatingGroupAvatar && <p className="mt-1 text-xs text-brand-300">Actualizando imagen…</p>}
                        </div>

                        <div className="mt-5 border-t border-white/10 pt-3">
                          <p className="mb-2 px-1 text-xs font-semibold uppercase text-white/40">Integrantes</p>
                          <div className="space-y-1">
                            {groupMembers.map((member) => (
                              <div key={member.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]">
                                <ChatAvatar url={member.avatar} name={member.name} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-white">
                                    {member.name}{member.id === uid ? ' (vos)' : ''}
                                  </span>
                                  {member.isAdmin && <span className="block text-[11px] text-brand-300">Administrador</span>}
                                </span>
                                {activeGroupAdmin && member.id !== uid && member.id !== activeGroup.created_by && (
                                  <button
                                    type="button"
                                    onClick={() => void removeGroupMember(member.id)}
                                    disabled={removingMemberId === member.id}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-300 transition hover:bg-red-400/10 disabled:opacity-40"
                                    title={`Quitar a ${member.name}`}
                                    aria-label={`Quitar a ${member.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {groupAdminError && <p className="mt-3 rounded-xl bg-red-400/10 px-3 py-2 text-xs text-red-300">{groupAdminError}</p>}
                        </div>
                      </div>
                    ) : (
                    <>
                    <div ref={threadRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                      {(activeGroup ? groupThread : thread).length === 0 ? (
                        <p className="mt-6 text-center text-xs text-white/45">
                          No hay mensajes todavía. ¡Escribí el primero!
                        </p>
                      ) : (
                        (activeGroup ? groupThread : thread).map((m) => {
                          const mine = m.sender_id === uid;
                          return (
                            <div
                              key={m.id}
                              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                  mine
                                    ? 'bg-brand-500 !text-white'
                                    : 'bg-white/10 text-white'
                                }`}
                              >
                                {activeGroup && !mine && 'senderName' in m && (
                                  <p className="mb-0.5 text-[10px] font-semibold text-brand-300">
                                    {m.senderName}
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                <p
                                  className={`mt-0.5 text-[10px] ${mine ? '!text-white/70' : 'text-white/45'}`}
                                >
                                  {timeShort(m.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {upgradeNotice && (
                      <div className="mx-3 mb-2 rounded-lg border border-white/15 bg-white/[0.06] p-3">
                        <p className="text-xs leading-relaxed text-white/70">
                          {planRestriction(upgradeNotice === 'student' ? 'student_messages' : 'company_messages').message}
                          {upgradeNotice === 'student' && ' También podés solicitar conexión desde el perfil.'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {upgradeNotice === 'student' && active && (
                            <button
                              type="button"
                              onClick={() => goToProfile(active.id)}
                              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10"
                            >
                              Solicitar conexión
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              navigate('/app/planes');
                              setOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-white/90"
                          >
                            Ver plan Pro <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      className={`dash-panel relative z-10 flex shrink-0 items-center gap-2 border-t border-white/10 px-2 pt-2 ${
                        mobileKeyboardOpen
                          ? 'pb-0'
                          : 'pb-[max(0.5rem,env(safe-area-inset-bottom))]'
                      }`}
                    >
                      <input
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value);
                          if (upgradeNotice) setUpgradeNotice(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Escribí un mensaje…"
                        className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/35 outline-none focus:border-brand-400/60 lg:text-sm"
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !text.trim()}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 !text-white transition hover:bg-brand-400 disabled:opacity-50"
                        aria-label="Enviar"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                    </>
                    )}
                  </div>
                ) : (
                  /* ── Lista de conversaciones ── */
                  <div className="h-full overflow-y-auto lg:h-auto lg:max-h-[380px]">
                    {composerMode === 'menu' ? (
                      <div className="p-3">
                        <p className="px-1 pb-2 text-xs font-semibold uppercase text-white/40">Nueva conversación</p>
                        <button
                          type="button"
                          onClick={() => setComposerMode('group')}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-white/[0.06]"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
                            <Users className="h-5 w-5" />
                          </span>
                          <span className="text-sm font-semibold text-white">Nuevo grupo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposerMode('contact')}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-white/[0.06]"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
                            <UserPlus className="h-5 w-5" />
                          </span>
                          <span className="text-sm font-semibold text-white">Nuevo chat</span>
                        </button>
                      </div>
                    ) : composerMode === 'contact' ? (
                      <div className="p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <button onClick={() => setComposerMode('menu')} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" aria-label="Volver">
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <p className="text-sm font-semibold text-white">Nuevo chat</p>
                        </div>
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                          <input
                            value={contactQuery}
                            onChange={(event) => setContactQuery(event.target.value)}
                            placeholder="Buscar por nombre"
                            autoFocus
                            className="w-full rounded-xl border border-white/12 bg-white/5 py-2 pl-9 pr-3 text-base text-white outline-none placeholder:text-white/35 lg:text-sm"
                          />
                        </div>
                        <ContactList
                          contacts={filteredContacts}
                          loading={loadingSuggestions}
                          onPick={(contact) => {
                            resetComposer();
                            openChatWith(contact.id, contact.name, contact.avatar);
                          }}
                        />
                      </div>
                    ) : composerMode === 'group' ? (
                      <div className="p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <button onClick={() => setComposerMode('menu')} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" aria-label="Volver">
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <p className="text-sm font-semibold text-white">Nuevo grupo</p>
                        </div>
                        <div className="mb-3 flex items-center gap-3">
                          <label className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5">
                            {groupAvatarPreview ? (
                              <img src={groupAvatarPreview} alt="Foto del grupo" className="h-full w-full object-cover" />
                            ) : (
                              <Camera className="h-5 w-5 text-white/45" />
                            )}
                            <input type="file" accept="image/*" onChange={handleGroupAvatar} className="hidden" />
                          </label>
                          <input
                            value={groupName}
                            onChange={(event) => setGroupName(event.target.value)}
                            placeholder="Nombre del grupo"
                            maxLength={80}
                            className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-base text-white outline-none placeholder:text-white/35 lg:text-sm"
                          />
                        </div>
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                          <input
                            value={contactQuery}
                            onChange={(event) => setContactQuery(event.target.value)}
                            placeholder="Buscar integrantes"
                            className="w-full rounded-xl border border-white/12 bg-white/5 py-2 pl-9 pr-3 text-base text-white outline-none placeholder:text-white/35 lg:text-sm"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredContacts.map((contact) => {
                            const selected = selectedMemberIds.has(contact.id);
                            return (
                              <button
                                key={contact.id}
                                type="button"
                                onClick={() => setSelectedMemberIds((current) => {
                                  const next = new Set(current);
                                  if (selected) next.delete(contact.id);
                                  else next.add(contact.id);
                                  return next;
                                })}
                                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/[0.06]"
                              >
                                <ChatAvatar url={contact.avatar} name={contact.name} />
                                <span className="min-w-0 flex-1 truncate text-sm text-white">{contact.name}</span>
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-white/20'}`}>
                                  {selected && <Check className="h-3 w-3" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {groupError && <p className="mt-2 text-xs text-red-300">{groupError}</p>}
                        <button
                          type="button"
                          onClick={() => void createGroup()}
                          disabled={creatingGroup || groupName.trim().length < 2 || selectedMemberIds.size < 1}
                          className="mt-3 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                        >
                          {creatingGroup ? 'Creando…' : `Crear grupo (${selectedMemberIds.size + 1})`}
                        </button>
                      </div>
                    ) : combinedConversations.length === 0 ? (
                      <div className="px-3 py-5">
                        <div className="px-1 text-center">
                          <p className="text-sm font-semibold text-white">Empezá una conversación</p>
                          <p className="mt-1 text-xs text-white/50">Perfiles que podrían interesarte</p>
                        </div>
                        {loadingSuggestions ? (
                          <p className="py-6 text-center text-xs text-white/40">Buscando perfiles…</p>
                        ) : suggestions.length > 0 ? (
                          <div className="mt-4 space-y-1">
                            {suggestions.slice(0, 4).map((contact) => (
                              <button
                                key={contact.id}
                                type="button"
                                onClick={() => openChatWith(contact.id, contact.name, contact.avatar)}
                                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.06]"
                              >
                                <ChatAvatar url={contact.avatar} name={contact.name} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-white">
                                    {contact.name}
                                  </span>
                                  <span className="block text-[11px] text-white/45">
                                    {suggestedRoleLabel[contact.role]}
                                  </span>
                                </span>
                                <MessageSquare className="h-4 w-4 shrink-0 text-brand-500" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              navigate('/app/explorar');
                              setOpen(false);
                            }}
                            className="mx-auto mt-4 block text-xs font-semibold text-brand-500 hover:underline"
                          >
                            Explorar perfiles
                          </button>
                        )}
                      </div>
                    ) : (
                      combinedConversations.map(({ kind, item }) => {
                        const isGroup = kind === 'group';
                        const id = isGroup ? (item as GroupConversation).id : (item as Conversation).otherId;
                        const name = item.name;
                        const avatar = isGroup ? (item as GroupConversation).avatar_url : (item as Conversation).avatar;
                        return (
                          <button
                            key={`${kind}-${id}`}
                            onClick={() => isGroup
                              ? openGroup(item as GroupConversation)
                              : openChatWith(id, name, avatar)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
                          >
                            <ChatAvatar url={avatar} name={name} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium text-white">{name}</span>
                                {isGroup && <Users className="h-3 w-3 shrink-0 text-white/35" />}
                                <span className="ml-auto shrink-0 text-[10px] text-white/40">{timeShort(item.lastAt)}</span>
                              </div>
                              <p className="truncate text-xs text-white/55">{item.last}</p>
                            </div>
                            {item.unread > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-400" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </MessagesContext.Provider>
  );
}
