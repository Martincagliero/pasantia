// Embajador: panel de inicio. Estado de verificación, puntos, nivel y accesos.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Megaphone, Trophy, ArrowRight, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { AmbassadorProfile } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, PageLoader } from '../ui/primitives';
import { VerifiedBadge } from './VerifiedBadge';
import { POINTS_PER_DIFFUSION, levelFor, orgTypeLabel } from './ambassadorConfig';

export default function AmbassadorHome() {
  const { session, profile } = useAuth();
  const [amb, setAmb] = useState<AmbassadorProfile | null>(null);
  const [diffusions, setDiffusions] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const uid = session!.user.id;
        const [{ data: prof }, { count: myCount }, { data: rankData }] = await Promise.all([
          supabase.from('ambassador_profiles').select('*').eq('id', uid).single(),
          supabase
            .from('internship_diffusions')
            .select('internship_id', { count: 'exact', head: true })
            .eq('ambassador_id', uid),
          // Solo traer los counts por embajador sin todos los rows
          supabase
            .from('internship_diffusions')
            .select('ambassador_id')
            .limit(500),
        ]);
        if (!active) return;
        setAmb((prof as AmbassadorProfile) ?? null);
        const mc = myCount ?? 0;
        setDiffusions(mc);
        // ranking simple
        if (mc > 0 && rankData) {
          const counts = new Map<string, number>();
          rankData.forEach((d: { ambassador_id: string }) =>
            counts.set(d.ambassador_id, (counts.get(d.ambassador_id) ?? 0) + 1)
          );
          const sorted = Array.from(counts.values()).sort((a, b) => b - a);
          setRank(sorted.findIndex((c) => c <= mc) + 1);
        }
      } catch {
        // silently ignore — mostrar pantalla igual
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session]);

  if (loading) return <PageLoader />;

  const points = diffusions * POINTS_PER_DIFFUSION;
  const level = levelFor(points);
  const progress = level.next ? Math.min(100, Math.round((points / level.next) * 100)) : 100;
  const name = amb?.org_name || profile?.full_name || 'Comunidad';

  return (
    <div>
      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{name}</h1>
          <VerifiedBadge verified={!!amb?.verified} />
        </div>
        <p className="mt-1.5 text-[15px] text-white/60">
          {orgTypeLabel(amb?.org_type)} · Panel de embajador de PasantIA
        </p>
      </div>

      {!amb?.verified && (
        <Card className="mb-6 border-amber-300/25 bg-amber-400/[0.07]">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-amber-300" />
            <div>
              <p className="font-semibold text-white">Tu cuenta está en revisión</p>
              <p className="mt-1 text-sm text-white/70">
                El equipo de PasantIA está validando tu comunidad. Mientras tanto podés
                completar tu perfil. Cuando te verifiquemos vas a poder difundir pasantías
                y sumar puntos.
              </p>
              <Button as="link" to="/app/embajador-perfil" variant="secondary" size="sm" className="mt-4">
                Completar perfil
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="!p-3.5 sm:!p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            <Trophy className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <p className="mt-3 text-2xl font-bold text-white">{points}</p>
          <p className="mt-0.5 text-xs text-white/55 sm:text-sm">Puntos</p>
        </Card>
        <Card className="!p-3.5 sm:!p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            <Megaphone className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <p className="mt-3 text-2xl font-bold text-white">{diffusions}</p>
          <p className="mt-0.5 text-xs text-white/55 sm:text-sm">Difusiones</p>
        </Card>
        <Card className="!p-3.5 sm:!p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <p className="mt-3 text-base font-bold text-white">{level.name}</p>
          <p className="mt-0.5 text-xs text-white/55 sm:text-sm">Nivel</p>
        </Card>
        <Card className="!p-3.5 sm:!p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            <Trophy className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <p className="mt-3 text-2xl font-bold text-white">{rank ? `#${rank}` : '—'}</p>
          <p className="mt-0.5 text-xs text-white/55 sm:text-sm">Ranking</p>
        </Card>
      </div>

      {/* Progreso de nivel */}
      <Card className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-white">Nivel: {level.name}</span>
          <span className="text-white/60">
            {level.next ? `${points}/${level.next} pts` : '¡Nivel máximo!'}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Accesos */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <QuickLink to="/app/anuncios" icon={<Megaphone className="h-5 w-5" />} title="Anuncios" desc="Publicá o difundí pasantías" />
        <QuickLink to="/app/ranking" icon={<Trophy className="h-5 w-5" />} title="Ranking" desc="Mirá cómo vas vs. otras comunidades" />
        <QuickLink to="/app/embajador-perfil" icon={<Share2 className="h-5 w-5" />} title="Mi comunidad" desc="Editá tus datos e Instagram" />
      </div>
    </div>
  );
}

function QuickLink({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="glass group flex items-center justify-between gap-3 rounded-2xl border border-white/12 p-3.5 transition hover:-translate-y-0.5 hover:border-white/25 hover:shadow-xl hover:shadow-brand-950/30 sm:p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">{icon}</div>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="text-sm text-white/60">{desc}</p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
    </Link>
  );
}
