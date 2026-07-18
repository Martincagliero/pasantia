// Embajador: ranking de comunidades por difusiones.
import { useEffect, useMemo, useState } from 'react';
import { Trophy, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { AmbassadorProfile } from '../../lib/database.types';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { VerifiedBadge } from './VerifiedBadge';
import { POINTS_PER_DIFFUSION, orgTypeLabel } from './ambassadorConfig';

interface Ranked {
  id: string;
  name: string;
  org_type: AmbassadorProfile['org_type'];
  instagram_url: string | null;
  verified: boolean;
  diffusions: number;
}

export default function AmbassadorLeaderboard() {
  const { session } = useAuth();
  const [rows, setRows] = useState<Ranked[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
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
        org_type: a.org_type,
        instagram_url: a.instagram_url,
        verified: a.verified,
        diffusions: counts.get(a.id) ?? 0,
      }));
      ranked.sort((a, b) => b.diffusions - a.diffusions);
      setRows(ranked);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  const medal = useMemo(() => ['🥇', '🥈', '🥉'], []);

  if (loading) return <PageLoader />;

  const withActivity = rows.filter((r) => r.diffusions > 0);

  return (
    <div>
      <PageHeader
        title="Ranking de comunidades"
        description="Las comunidades que más difunden lideran la tabla."
      />

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
                className={`!p-4 flex items-center gap-4 ${isMe ? 'border-white/30 bg-white/[0.08]' : ''}`}
              >
                <div className="w-8 shrink-0 text-center text-lg font-bold text-white">
                  {idx < 3 ? medal[idx] : `#${idx + 1}`}
                </div>
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
                {r.instagram_url && (
                  <a
                    href={r.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-white/50 transition hover:text-white"
                    title="Instagram"
                  >
                    <Share2 className="h-4 w-4" />
                  </a>
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
