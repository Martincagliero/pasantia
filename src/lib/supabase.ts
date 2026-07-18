// Cliente único de Supabase para toda la app (auth + base de datos + storage).
// Las credenciales se leen de variables de entorno (VITE_*) definidas en .env.local.
// Ver .env.example para el formato.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True cuando hay credenciales configuradas. Permite mostrar avisos claros en vez de romper. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // No lanzamos error para que la landing siga funcionando sin credenciales,
  // pero avisamos en consola para el desarrollador.
  console.warn(
    '[Supabase] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Copiá .env.example a .env.local y completá tus credenciales.'
  );
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
