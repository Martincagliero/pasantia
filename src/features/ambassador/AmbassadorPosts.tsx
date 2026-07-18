import { useEffect, useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { AmbassadorPost } from '../../lib/database.types';
import { Card, EmptyState } from '../ui/primitives';

interface AmbassadorPostsProps {
  refetch?: number; // Trigger refresh
}

export default function AmbassadorPosts({ refetch }: AmbassadorPostsProps) {
  const { session } = useAuth();
  const [posts, setPosts] = useState<AmbassadorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchPosts = async () => {
      if (!session) return;

      try {
        const { data, error } = await supabase
          .from('ambassador_posts')
          .select('*')
          .eq('ambassador_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (active) {
          setPosts((data as AmbassadorPost[]) || []);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPosts();
    return () => {
      active = false;
    };
  }, [session, refetch]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este anuncio?')) return;

    setDeleting(postId);
    try {
      const { error } = await supabase
        .from('ambassador_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Error al eliminar el anuncio');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-white/50" />
      </div>
    );
  }

  if (posts.length === 0) {
    return <EmptyState title="Sin anuncios" description="Crea tu primer anuncio para compartir pasantías." />;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <div className="flex gap-4">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="h-24 w-24 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white">{post.title}</h3>
              <p className="mt-1 text-sm text-white/70 line-clamp-2">{post.description}</p>
              <p className="mt-2 text-xs text-white/50">
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => handleDeletePost(post.id)}
              disabled={deleting === post.id}
              className="p-2 text-white/50 hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {deleting === post.id ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
