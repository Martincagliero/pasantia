import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, GraduationCap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Post } from '../../lib/database.types';
import { useAuth } from '../auth/AuthProvider';
import { Card, EmptyState, PageLoader } from '../ui/primitives';
import { LinkPreview } from '../ui/LinkPreview';
import { PostInteractions } from '../ui/PostInteractions';
import { SocialPostImages, SocialPostText } from './SocialPostContent';
import { PostActionsMenu } from './PostActionsMenu';

export default function SharedPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
      if (!active) return;
      setPost(data as Post | null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-white/65 transition hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      {!post ? (
        <EmptyState
          title="Publicación no disponible"
          description="Puede haber sido eliminada o ya no tenés acceso para verla."
        />
      ) : (
        <Card className="flex flex-col">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-white/60">
              {post.author_role === 'empresa' ? (
                <Building2 className="h-4 w-4 shrink-0" />
              ) : (
                <GraduationCap className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate font-semibold text-white/80">
                {post.author_name || 'Usuario'}
              </span>
              <span>·</span>
              <span className="shrink-0">{new Date(post.created_at).toLocaleDateString('es-AR')}</span>
            </div>
            <PostActionsMenu
              post={post}
              currentUserId={session?.user.id}
              onDeleted={() => setPost(null)}
            />
          </div>

          {post.title && <h1 className="text-xl font-semibold leading-snug text-white sm:text-2xl">{post.title}</h1>}
          <p className={`${post.title ? 'mt-2' : ''} whitespace-pre-wrap break-words text-sm leading-relaxed text-white/75 sm:text-base`}>
            <SocialPostText text={post.body} mentions={post.mentions} />
          </p>
          <SocialPostImages urls={post.image_urls} />
          {post.link_url && <LinkPreview url={post.link_url} className="mt-3" />}
          <div className="mt-4 border-t border-white/10 pt-3">
            <PostInteractions targetType="post" targetId={post.id} />
          </div>
        </Card>
      )}
    </div>
  );
}