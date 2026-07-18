// Carga de foto de perfil (obligatoria, estilo LinkedIn).
// Sube la imagen al bucket "cvs" en avatars/{uid}.ext y devuelve la URL pública.
import { useState, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  uid: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

export function AvatarUpload({ uid, value, onChange, label = 'Foto de perfil', hint }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-subir el mismo archivo
    if (!file) return;
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG o WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    setUploading(true);
    const path = `avatars/${uid}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('cvs')
      .upload(path, file, { upsert: true });

    if (upErr) {
      setError('No se pudo subir la imagen. Verificá que el bucket "cvs" exista.');
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('cvs').getPublicUrl(path);
    onChange(`${data.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/80">
        {label} <span className="text-red-300">*</span>
      </label>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/5">
            {value ? (
              <img src={value} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-7 w-7 text-white/35" strokeWidth={1.75} />
            )}
          </div>
        </div>
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
            <Camera className="h-4 w-4" />
            {uploading ? 'Subiendo…' : value ? 'Cambiar foto' : 'Subir foto'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="mt-1.5 text-xs text-white/45">
            {hint ?? 'JPG, PNG o WEBP · máx 5 MB · obligatoria'}
          </p>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
