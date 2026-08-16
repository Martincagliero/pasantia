// Embajador: ranking de comunidades por difusiones.
import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Share2, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { AmbassadorProfile } from '../../lib/database.types';
import { createAchievementStory, shareAchievementFile } from '../../lib/achievementStory';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { VerifiedBadge } from './VerifiedBadge';
import { POINTS_PER_DIFFUSION, levelFor, orgTypeLabel } from './ambassadorConfig';

interface Ranked {
  id: string;
  name: string;
  logo_url: string | null;
  org_type: AmbassadorProfile['org_type'];
  instagram_url: string | null;
  verified: boolean;
  diffusions: number;
}

async function createAchievementImage(row: Ranked, rank: number): Promise<File> {
  const points = row.diffusions * POINTS_PER_DIFFUSION;
  const level = levelFor(points).name;
  const safeName = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'comunidad';
  return createAchievementStory({
    filename: `logro-pasantia-${safeName}.png`,
    kicker: 'Comunidad que genera impacto',
    name: row.name,
    subtitle: orgTypeLabel(row.org_type),
    rankingLabel: 'Ranking de comunidades',
    rank,
    primaryLabel: 'Impacto acumulado',
    primaryValue: points,
    primaryCaption: 'puntos por hacer circular oportunidades',
    stats: [
      { label: 'difusiones', value: row.diffusions },
      { label: 'nivel', value: level },
    ],
    quote: 'Cada difusión acerca una oportunidad.',
    closing: 'Seguimos conectando talento con futuro.',
  });
}

export default function AmbassadorLeaderboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Ranked[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ data: ambs }, { data: diff }] = await Promise.all([
          supabase.from('ambassador_profiles').select('*'),
          supabase.from('internship_diffusions').select('ambassador_id'),
        ]);
        if (!active) return;
        const counts = new Map<string, number>();
        (diff ?? []).forEach((d: { ambassador_id: string }) =>
          counts.set(d.ambassador_id, (counts.get(d.ambassador_id) ?? 0) + 1)
        );
        const ranked: Ranked[] = ((ambs as AmbassadorProfile[]) ?? []).map((a) => ({
          id: a.id,
          name: a.org_name || 'Comunidad',
          logo_url: a.logo_url,
          org_type: a.org_type,
          instagram_url: a.instagram_url,
          verified: a.verified,
          diffusions: counts.get(a.id) ?? 0,
        }));
        ranked.sort((a, b) => b.diffusions - a.diffusions);
        setRows(ranked);
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session]);

  if (loading) return <PageLoader />;

  const withActivity = rows.filter((r) => r.diffusions > 0);

  const shareAchievement = async (row: Ranked, rank: number) => {
    setSharingId(row.id);
    setShareMessage('');
    try {
      const file = await createAchievementImage(row, rank);
      const result = await shareAchievementFile(
        file,
        `Mi logro en PasantIA: puesto #${rank}`,
        `Estoy en el puesto #${rank} del ranking de comunidades de PasantIA.`
      );
      setShareMessage(
        result === 'shared'
          ? 'Imagen lista para compartir.'
          : 'Imagen descargada. Ya podés publicarla en LinkedIn, tu story o estado.'
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareMessage('No pudimos generar la imagen. Intentá de nuevo.');
    } finally {
      setSharingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Ranking de comunidades"
        description="Las comunidades que más difunden lideran la tabla. Compartí tu puesto en LinkedIn, stories o estados."
      />

      {shareMessage && (
        <p className="mb-3 text-right text-xs font-medium text-brand-500" role="status">
          {shareMessage}
        </p>
      )}

      {withActivity.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="Todavía no hay actividad"
          description="Cuando las comunidades empiecen a difundir, el ranking se va a llenar acá."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r, idx) => {
            const isMe = r.id === session!.user.id;
            const points = r.diffusions * POINTS_PER_DIFFUSION;
            return (
              <Card
                key={r.id}
                className={`flex items-center gap-2.5 !p-3 sm:gap-4 sm:!p-4 ${isMe ? 'border-white/30 bg-white/[0.08]' : ''}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    idx === 0
                      ? 'bg-brand-500 !text-white'
                      : idx < 3
                        ? 'bg-brand-500/15 text-brand-500'
                        : 'bg-white/10 text-white/60'
                  }`}
                >
                  {idx + 1}
                </span>
                {r.logo_url ? (
                  <img
                    src={r.logo_url}
                    alt={r.name}
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-10 shrink-0 rounded-full border border-white/12 object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-xs font-bold text-white">
                    {r.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-white">{r.name}</p>
                    {r.verified && <VerifiedBadge verified />}
                    {isMe && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                        Vos
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-white/50">{orgTypeLabel(r.org_type)}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(`/app/explorar?u=${encodeURIComponent(r.id)}`)}
                    className="shrink-0 text-white/50 transition hover:text-white"
                    title={`Ver perfil de ${r.name}`}
                    aria-label={`Ver perfil de ${r.name}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                </button>
                {isMe && (
                  <button
                    type="button"
                    onClick={() => void shareAchievement(r, idx + 1)}
                    disabled={sharingId === r.id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold !text-white transition hover:bg-brand-400 disabled:cursor-wait disabled:opacity-70"
                    title="Compartir mi logro"
                  >
                    {sharingId === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">Compartir logro</span>
                  </button>
                )}
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-white">{points}</p>
                  <p className="text-xs text-white/50">{r.diffusions} difus.</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
