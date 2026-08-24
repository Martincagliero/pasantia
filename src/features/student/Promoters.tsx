// Estudiante: sección "Promotores".
// - Todos ven el RANKING de promotores (nombre + cuánta gente sumó).
// - Estudiante Pro recibe automáticamente su enlace y ve sus totales.
import { useEffect, useState } from 'react';
import { Copy, Check, Share2, Trophy, Trash2, GraduationCap, Building2, Users, Link2, Info, X, Gift, Rocket, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { createAchievementStory, shareAchievementFile } from '../../lib/achievementStory';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader, PageLoader } from '../ui/primitives';
import rankingIcon from '../../assets/images/emojis/estrella-de-ranking.svg';
import { activePlan } from '../../lib/plans';

interface MyPromoter {
  code: string;
  total: number;
  estudiantes: number;
  empresas: number;
  embajadores: number;
  activados: number;
}

interface RankRow {
  code: string;
  nombre: string;
  avatar_url?: string | null;
  total: number;
  estudiantes: number;
  empresas: number;
  comunidades: number;
}

async function createPromoterAchievementImage(row: RankRow, rank: number): Promise<File> {
  const safeName = row.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'promotor';
  return createAchievementStory({
    filename: `logro-promotor-pasantia-${safeName}.png`,
    kicker: 'Promotor/a que hace crecer la red',
    name: row.nombre,
    subtitle: 'Promotor/a de PasantIA',
    rankingLabel: 'Ranking de promotores',
    rank,
    primaryLabel: 'Personas que sumé',
    primaryValue: row.total,
    primaryCaption: 'nuevas personas conectadas con la comunidad',
    stats: [
      { label: 'estudiantes', value: row.estudiantes },
      { label: 'empresas', value: row.empresas },
      { label: 'comunidades', value: row.comunidades },
    ],
    quote: 'Compartir también es abrir puertas.',
    closing: 'La red crece cuando las oportunidades se comparten.',
  });
}

export default function Promoters() {
  const { session, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MyPromoter | null>(null);
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [promoterDetailsOpen, setPromoterDetailsOpen] = useState(false);
  const [sharingAchievement, setSharingAchievement] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const link = me ? `${window.location.origin}/?ref=${me.code}` : '';

  async function loadRanking() {
    const { data } = await supabase.rpc('public_promoter_ranking');
    setRanking(
      ((data ?? []) as RankRow[]).map((r) => ({
        code: r.code,
        nombre: r.nombre,
        avatar_url: r.avatar_url ?? null,
        total: Number(r.total),
        estudiantes: Number(r.estudiantes),
        empresas: Number(r.empresas),
        comunidades: Number(r.comunidades),
      }))
    );
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const [mine, rank] = await Promise.all([
        supabase.rpc('my_promoter'),
        supabase.rpc('public_promoter_ranking'),
      ]);
      if (!active) return;

      const row = (Array.isArray(mine.data) ? mine.data[0] : mine.data) as MyPromoter | undefined;
      setMe(
        row
          ? {
              code: row.code,
              total: Number(row.total ?? 0),
              estudiantes: Number(row.estudiantes ?? 0),
              empresas: Number(row.empresas ?? 0),
              embajadores: Number(row.embajadores ?? 0),
              activados: Number(row.activados ?? 0),
            }
          : null
      );
      setRanking(
        ((rank.data ?? []) as RankRow[]).map((r) => ({
          code: r.code,
          nombre: r.nombre,
          avatar_url: r.avatar_url ?? null,
          total: Number(r.total),
          estudiantes: Number(r.estudiantes),
          empresas: Number(r.empresas),
          comunidades: Number(r.comunidades),
        }))
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session, profile?.plan, profile?.plan_expires_at]);

  async function removePromoter(code: string) {
    const { error } = await supabase.rpc('admin_remove_promoter', { p_code: code });
    if (!error) loadRanking();
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function share() {
    if (!link) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Sumate a Pasantía',
          text: 'Estamos construyendo Pasantía. ¡Sumate con mi enlace!',
          url: link,
        });
      } else {
        await copyLink();
      }
    } catch {
      /* cancelado */
    }
  }

  async function shareAchievement(row: RankRow, rank: number) {
    setSharingAchievement(true);
    setShareMessage('');
    try {
      const file = await createPromoterAchievementImage(row, rank);
      const result = await shareAchievementFile(
        file,
        `Mi logro como promotor/a de PasantIA: puesto #${rank}`,
        `Estoy en el puesto #${rank} del ranking de promotores de PasantIA y ya sumé ${row.total} personas.`
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
      setSharingAchievement(false);
    }
  }

  if (loading) return <PageLoader />;

  const myRankIndex = me ? ranking.findIndex((row) => row.code === me.code) : -1;
  const myRankRow = myRankIndex >= 0 ? ranking[myRankIndex] : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Promotores"
          description="Ayudanos a construir Pasantía. Mirá quiénes están sumando gente y sumate vos también."
        />
        <button
          onClick={() => setShowInfo(true)}
          title="¿Qué es ser promotor?"
          aria-label="Información sobre promotores"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-white/12 bg-[#16181D] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInfo(false)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
              <Rocket className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Ser promotor/a</h3>
            <p className="mt-1 text-sm text-white/60">
              Ayudás a construir Pasantía invitando gente con tu enlace personal.
            </p>
            <ul className="mt-4 space-y-3">
              {[
                { icon: Link2, text: 'Tenés tu enlace propio (?ref=) para compartir.' },
                { icon: Users, text: 'Cada persona que se registra con tu enlace suma a tu nombre.' },
                { icon: Trophy, text: 'Aparecés en el ranking público de promotores.' },
                { icon: Gift, text: 'Mientras más sumás, más cerca estás de los beneficios que vamos a habilitar.' },
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70">
                    <b.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-white/80">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Bloque personal: enlace propio (si sos promotor) o CTA para solicitarlo */}
      {me ? (
        <Card className="mb-4 !p-3 sm:mb-6 sm:!p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/70">
              <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide sm:text-xs">Tu enlace de promotor</span>
            </div>
            <button
              type="button"
              onClick={() => setPromoterDetailsOpen((open) => !open)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-500 sm:hidden"
              aria-expanded={promoterDetailsOpen}
            >
              {promoterDetailsOpen ? 'Ocultar' : 'Ver detalles'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${promoterDetailsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className={`${promoterDetailsOpen ? 'hidden' : 'flex'} mt-2.5 gap-2 sm:hidden`}>
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs text-white/90 outline-none focus:border-brand-400/60"
            />
            <button
              type="button"
              onClick={copyLink}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-brand-500"
              aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className={`${promoterDetailsOpen ? 'block' : 'hidden'} sm:block`}>
            <p className="mt-2 text-[11px] text-white/60 sm:text-sm">
              Todo el que se registre con este enlace queda contabilizado a tu nombre.
            </p>

            <div className="mt-2.5 flex flex-col gap-2 sm:mt-4 sm:flex-row">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs text-white/90 outline-none focus:border-brand-400/60 sm:px-4 sm:py-2.5 sm:text-sm"
              />
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={copyLink} className="flex-1 sm:flex-none">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
                </Button>
                <Button variant="primary" size="sm" onClick={share} className="flex-1 sm:flex-none">
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
              {[
                { label: 'Estudiantes', value: me.estudiantes },
                { label: 'Empresas', value: me.empresas },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-center sm:rounded-2xl sm:p-3"
                >
                  <p className="text-base font-bold text-white sm:text-2xl">{m.value}</p>
                  <p className="mt-0.5 text-[9px] leading-tight text-white/55 sm:text-xs">{m.label}</p>
                </div>
              ))}
            </div>
            {myRankRow && (
              <button
                type="button"
                onClick={() => void shareAchievement(myRankRow, myRankIndex + 1)}
                disabled={sharingAchievement}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-brand-400 disabled:cursor-wait disabled:opacity-70 sm:mt-4"
              >
                {sharingAchievement ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Compartir mi logro
              </button>
            )}
            {shareMessage && (
              <p className="mt-2 text-center text-xs font-medium text-brand-500" role="status">
                {shareMessage}
              </p>
            )}
          </div>
        </Card>
      ) : activePlan(profile) !== 'pro' ? (
        <Card className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-brand-500">
            <Rocket className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Tu enlace de promotor viene con Pro</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Al activar Estudiante Pro recibís automáticamente tu enlace personal, sumás personas y participás del ranking.
          </p>
          <div className="mt-5 flex justify-center">
            <Button as="link" to="/app/planes" variant="primary" size="sm">Ver Estudiante Pro</Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-white">Activando tu enlace de promotor</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Tu plan Pro ya está activo. El enlace personal va a aparecer acá automáticamente.
          </p>
        </Card>
      )}

      {/* Ranking de promotores (visible para todos) */}
      <div className="mb-3 flex items-center gap-2">
        <img src={rankingIcon} alt="" className="h-6 w-6 object-contain" />
        <h2 className="text-base font-bold text-white">Ranking de promotores</h2>
      </div>

      <div className="space-y-2.5">
        {ranking.map((r, i) => {
          const top = i === 0;
          const isMe = me?.code === r.code;
          return (
            <div
              key={r.code}
              className={`group flex items-center gap-3 rounded-2xl border p-3 transition sm:gap-4 sm:p-4 ${
                isMe
                  ? 'border-brand-500/40 bg-brand-500/[0.06]'
                  : top
                  ? 'border-white/25 bg-white/[0.06]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-sm font-bold text-white/70">
                {i + 1}
              </div>

              {r.avatar_url ? (
                <img
                  src={r.avatar_url}
                  alt={r.nombre}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 shrink-0 rounded-full border border-white/12 object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-xs font-bold text-white">
                  {r.nombre
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-white">{r.nombre}</p>
                <div className="mt-1.5 flex flex-wrap gap-1 sm:gap-1.5">
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-white/12 bg-white/5 px-1.5 py-px text-[9px] font-medium text-white/70 sm:gap-1 sm:px-2 sm:py-0.5 sm:text-[11px]">
                    <GraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {r.estudiantes} estudiantes
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-white/12 bg-white/5 px-1.5 py-px text-[9px] font-medium text-white/70 sm:gap-1 sm:px-2 sm:py-0.5 sm:text-[11px]">
                    <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {r.empresas} empresas
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-white/12 bg-white/5 px-1.5 py-px text-[9px] font-medium text-white/70 sm:gap-1 sm:px-2 sm:py-0.5 sm:text-[11px]">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {r.comunidades} comunidades
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-2xl font-black leading-none text-white">{r.total}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  sumados
                </p>
              </div>

              {isMe && (
                <button
                  type="button"
                  onClick={() => void shareAchievement(r, i + 1)}
                  disabled={sharingAchievement}
                  title="Compartir mi logro"
                  aria-label="Compartir mi logro"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 !text-white transition hover:bg-brand-400 disabled:cursor-wait disabled:opacity-70"
                >
                  {sharingAchievement ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                </button>
              )}

              {profile?.is_admin && (
                <button
                  onClick={() => removePromoter(r.code)}
                  title="Quitar promotor"
                  className="shrink-0 rounded-xl border border-red-400/20 bg-red-500/5 p-2 text-red-300 opacity-0 transition hover:bg-red-500/15 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
        {ranking.length === 0 && (
          <Card className="text-center text-sm text-white/45">
            Todavía no hay promotores. ¡Podés ser el primero!
          </Card>
        )}
      </div>
    </div>
  );
}
