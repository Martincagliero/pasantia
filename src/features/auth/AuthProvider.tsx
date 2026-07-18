// Contexto de autenticación: expone la sesión actual, el perfil (con rol) y
// las acciones signIn / signUp / signOut. Envuelve la app para que cualquier
// componente sepa si hay un usuario logueado y qué rol tiene.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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
  const meta = (user.user_metadata ?? {}) as { role?: string; full_name?: string };
  const metaRole = VALID_ROLES.includes(meta.role as Role) ? (meta.role as Role) : null;
  const metaName = (meta.full_name ?? '').trim();

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
  } else if (metaRole && prof.role !== metaRole) {
    await supabase
      .from('profiles')
      .update({ role: metaRole, full_name: metaName || prof.full_name })
      .eq('id', user.id);
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    prof = (data as Profile) ?? null;
  } else if (metaName && !prof.full_name) {
    await supabase.from('profiles').update({ full_name: metaName }).eq('id', user.id);
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    prof = (data as Profile) ?? null;
  }

  if (prof) {
    await ensureSubtable(prof.role, user.id, metaName || prof.full_name);
  }
  return prof;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user: User) => {
    const p = await ensureProfile(user);
    setProfile(p);
  }, []);

  useEffect(() => {
    let active = true;

    // Sesión inicial
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user);
      setLoading(false);
    });

    // Cambios de sesión (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      if (newSession?.user) {
        await loadProfile(newSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, role }: SignUpData) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user);
  }, [session, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, loading, signIn, signUp, signOut, refreshProfile }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile]
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
