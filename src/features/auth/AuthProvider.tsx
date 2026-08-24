// Contexto de autenticación: expone la sesión actual, el perfil (con rol) y
// las acciones signIn / signUp / signOut. Envuelve la app para que cualquier
// componente sepa si hay un usuario logueado y qué rol tiene.
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
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Profile, Role } from '../../lib/database.types';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** true mientras se está resolviendo el perfil del usuario actual. */
  profileLoading: boolean;
  /** Rol que un admin eligió ver (para cambiar de panel). null = su rol real. */
  adminViewRole: Role | null;
  setAdminViewRole: (role: Role | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

const VALID_ROLES: Role[] = ['estudiante', 'empresa', 'embajador'];

// Se asegura de que exista la subtabla del rol (student/company/ambassador).
async function ensureSubtable(role: Role, id: string, name: string): Promise<void> {
  const table =
    role === 'empresa'
      ? 'company_profiles'
      : role === 'embajador'
        ? 'ambassador_profiles'
        : 'student_profiles';
  try {
    const { data } = await supabase.from(table).select('id').eq('id', id).maybeSingle();
    if (data) return;
    if (role === 'embajador') {
      await supabase.from(table).insert({ id, org_name: name || '' });
    } else {
      await supabase.from(table).insert({ id });
    }
  } catch {
    /* ignore */
  }
}

// Garantiza que el usuario tenga su profile con el ROL y NOMBRE que eligió al
// registrarse (guardados en user_metadata). Lo crea si falta o lo corrige si
// quedó con otro rol. Así cada cuenta tiene su perfil separado y correcto.
async function ensureProfile(user: User): Promise<Profile | null> {
  const meta = (user.user_metadata ?? {}) as { role?: string; full_name?: string; name?: string };
  const metaRole = VALID_ROLES.includes(meta.role as Role) ? (meta.role as Role) : null;
  const metaName = (meta.full_name ?? meta.name ?? '').trim();

  // Envuelto en try/catch: un error de red/RLS acá NO debe tirar abajo el login
  // (antes dejaba el spinner de carga girando para siempre). Ante falla,
  // devolvemos null y se reintenta en el próximo refreshProfile/re-login.
  try {
    let prof: Profile | null = null;
    {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      prof = (data as Profile) ?? null;
    }

    if (!prof) {
      await supabase.from('profiles').insert({
        id: user.id,
        role: metaRole ?? 'estudiante',
        full_name: metaName,
        email: user.email ?? '',
      });
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      prof = (data as Profile) ?? null;
    } else if (metaName && !prof.full_name) {
      // Solo completamos el nombre si está vacío. NO tocamos el rol de un perfil
      // que ya existe (respetamos lo que haya en la base / correcciones manuales).
      await supabase.from('profiles').update({ full_name: metaName }).eq('id', user.id);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      prof = (data as Profile) ?? null;
    }

    if (prof) {
      await ensureSubtable(prof.role, user.id, metaName || prof.full_name);
    }
    return prof;
  } catch (err) {
    console.warn('[Auth] No se pudo cargar/crear el perfil:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Mientras se resuelve el perfil (rol) del usuario actual. Evita que el
  // panel redirija al rol por defecto (estudiante) y "parpadee" al pasar al
  // panel correcto ni bien te registrás/logueás.
  const [profileLoading, setProfileLoading] = useState(true);
  // Solo para admins: panel de rol que están viendo (estudiante/empresa/embajador).
  const [adminViewRole, setAdminViewRoleState] = useState<Role | null>(() => {
    try {
      const v = localStorage.getItem('admin-view-role');
      return VALID_ROLES.includes(v as Role) ? (v as Role) : null;
    } catch {
      return null;
    }
  });
  const setAdminViewRole = useCallback((role: Role | null) => {
    setAdminViewRoleState(role);
    try {
      if (role) localStorage.setItem('admin-view-role', role);
      else localStorage.removeItem('admin-view-role');
    } catch {
      /* ignore */
    }
  }, []);
  // getSession() (carga inicial) y onAuthStateChange (login/logout/refresh)
  // pueden disparar loadProfile en paralelo. Si sus respuestas llegan
  // desordenadas (frecuente en mobile por latencia/reconexiones), la más
  // vieja podía pisar a la más nueva y dejar el perfil de OTRA cuenta
  // (ej. admin) trabado en pantalla. Este ref guarda cuál es el usuario
  // "vigente" para descartar respuestas tardías que ya no corresponden.
  const currentUserIdRef = useRef<string | null>(null);
  // id del usuario cuyo perfil YA está cargado en el estado. Sirve para NO
  // recargar (ni parpadear) cuando llegan eventos de auth repetidos del MISMO
  // usuario (TOKEN_REFRESHED, SIGNED_IN al volver el foco de la pestaña,
  // USER_UPDATED que dispara el onboarding). Antes cada evento recargaba el
  // perfil y prendía el spinner => la pantalla "titilaba en blanco".
  const loadedUserIdRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (user: User) => {
    currentUserIdRef.current = user.id;
    setProfileLoading(true);
    const p = await ensureProfile(user);
    if (currentUserIdRef.current !== user.id) return; // respuesta obsoleta, se descarta
    if (p) {
      setProfile(p);
      loadedUserIdRef.current = user.id;
    } else if (loadedUserIdRef.current !== user.id) {
      // No pudimos cargar el perfil y NO es el usuario que ya teníamos: recién
      // ahí lo dejamos en null. Si era el mismo usuario (fallo transitorio de
      // red/RLS) conservamos el perfil previo para no parpadear en blanco.
      setProfile(null);
    }
    setProfileLoading(false);
  }, []);

  const clearProfile = useCallback(() => {
    currentUserIdRef.current = null;
    loadedUserIdRef.current = null;
    setProfile(null);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    // Sesión inicial. try/finally: si algo falla (red, Supabase caído), igual
    // se apaga el loading en vez de dejar el spinner girando para siempre.
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (data.session?.user) {
          await loadProfile(data.session.user);
        } else {
          clearProfile();
        }
      })
      .catch((err) => {
        console.warn('[Auth] No se pudo obtener la sesión inicial:', err);
        if (active) clearProfile();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Cambios de sesión (login/logout/refresh). El callback es SÍNCRONO a
    // propósito: awaitear consultas de supabase acá dentro puede trabar el
    // cliente de auth (mantiene el lock) y disparar más eventos en cascada.
    // Por eso solo actualizamos la sesión y disparamos loadProfile sin await.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      const nextUser = newSession?.user ?? null;
      if (!nextUser) {
        clearProfile();
        return;
      }
      // Evento repetido del MISMO usuario que ya tenemos cargado (refresh de
      // token, foco de la pestaña, USER_UPDATED del onboarding): NO recargamos
      // el perfil para no prender el spinner y evitar el parpadeo en blanco.
      if (nextUser.id === loadedUserIdRef.current) return;
      void loadProfile(nextUser);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, clearProfile]);

  useEffect(() => {
    const user = session?.user;
    if (!user) return;

    const profileChannel = supabase
      .channel(`profile-live-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => {
          void loadProfile(user);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(profileChannel);
    };
  }, [session?.user, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/recovery`,
    });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, role }: SignUpData) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearProfile();
  }, [clearProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user);
  }, [session, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, loading, profileLoading, adminViewRole, setAdminViewRole, signIn, signInWithGoogle, requestPasswordReset, signUp, signOut, refreshProfile }),
    [session, profile, loading, profileLoading, adminViewRole, setAdminViewRole, signIn, signInWithGoogle, requestPasswordReset, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Traduce los mensajes de error más comunes de Supabase al español. */
function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese email.';
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('email not confirmed'))
    return 'Confirmá tu email antes de ingresar (revisá tu casilla).';
  if (m.includes('unable to validate email address')) return 'El email no es válido.';
  return message;
}
