import { useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Card } from '../ui/primitives';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreateAmbassadorPost({ onPostCreated }: CreatePostProps) {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setError('La imagen debe pesar menos de 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!session) {
      setError('Debes estar autenticado');
      return;
    }

    if (!description.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let imageUrl: string | null = null;

      // Upload imagen si existe
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const filename = `ambassador-posts/${session.user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(filename, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('cvs')
          .getPublicUrl(filename);

        imageUrl = urlData.publicUrl;
      }

      // Crear post en base de datos
      const { error: dbError } = await supabase.from('ambassador_posts').insert({
        ambassador_id: session.user.id,
        title: title.trim() || 'Nuevo anuncio',
        description: description.trim(),
        image_url: imageUrl,
      });

      if (dbError) throw dbError;

      // Limpiar formulario
      setTitle('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      onPostCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el anuncio');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white">Título (opcional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Nuevas oportunidades disponibles"
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Descripción del anuncio *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Comparte detalles sobre las pasantías que estás difundiendo..."
            rows={4}
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none resize-none"
          />
          <p className="mt-1 text-xs text-white/50">
            {description.length}/500 caracteres
          </p>
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-sm font-medium text-white">Imagen (opcional)</label>
          {imagePreview ? (
            <div className="mt-2 space-y-2">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="h-32 w-full rounded-lg object-cover"
              />
              <button
                onClick={handleRemoveImage}
                disabled={uploading}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <X size={16} />
                Remover imagen
              </button>
            </div>
          ) : (
            <label className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-white/20 p-6 cursor-pointer hover:border-white/30 transition-colors">
              <div className="text-center">
                <Upload size={24} className="mx-auto text-white/50 mb-2" />
                <span className="text-sm text-white/60">Haz clic para subir una imagen (máx 2MB)</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={uploading || !description.trim()}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Publicando...
            </>
          ) : (
            'Publicar anuncio'
          )}
        </Button>
      </div>
    </Card>
  );
}
