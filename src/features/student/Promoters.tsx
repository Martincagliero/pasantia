// Estudiante: sección "Promotores".
// - Todos ven el RANKING de promotores (nombre + cuánta gente sumó).
// - Si el usuario ES promotor (lo asignó el admin), ve su enlace y sus totales.
// - Si no lo es, ve un botón para solicitar ser promotor por Instagram.
// Los códigos NO se autogeneran: los asigna el admin.
import { useEffect, useState } from 'react';
import { Copy, Check, Share2, Trophy, Sparkles, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { CONTACT } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader, PageLoader } from '../ui/primitives';

interface MyPromoter {
  code: string;
  total: number;
  estudiantes: number;
  empresas: number;
  embajadores: number;
  activados: number;
}

interface RankRow {
  nombre: string;
  total: number;
  activados: number;
}

// Mensaje sugerido para pedir ser promotor (se copia al portapapeles).
const REQUEST_MESSAGE =
  '¡Hola! Quiero ser promotor/a de Pasantía y ayudar a sumar estudiantes, empresas y comunidades. ¿Cómo hago?';

export default function Promoters() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MyPromoter | null>(null);
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);

  const link = me ? `${window.location.origin}/?ref=${me.code}` : '';

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
          nombre: r.nombre,
          total: Number(r.total),
          activados: Number(r.activados),
        }))
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

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

  async function requestPromoter() {
    // Copiamos el mensaje sugerido y abrimos el DM de Instagram de Pasant.ia.
    try {
      await navigator.clipboard.writeText(REQUEST_MESSAGE);
      setMsgCopied(true);
      setTimeout(() => setMsgCopied(false), 3000);
    } catch {
      /* ignore */
    }
    window.open(`https://ig.me/m/${CONTACT.instagram}`, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Promotores"
        description="Ayudanos a construir Pasantía. Mirá quiénes están sumando gente y sumate vos también."
      />

      {/* Bloque personal: enlace propio (si sos promotor) o CTA para solicitarlo */}
      {me ? (
        <Card className="mb-6">
          <div className="flex items-center gap-2 text-brand-300">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Tu enlace de promotor</span>
          </div>
          <p className="mt-2 text-sm text-white/60">
            Todo el que se registre con este enlace queda contabilizado a tu nombre automáticamente.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm text-white/90 outline-none focus:border-brand-400/60"
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

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total', value: me.total },
              { label: 'Estudiantes', value: me.estudiantes },
              { label: 'Empresas', value: me.empresas },
              { label: 'Ya activados', value: me.activados },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="mt-0.5 text-xs text-white/55">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-brand-300">
            <Send className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">¿Querés ser promotor/a?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Sumate a construir Pasantía. Escribinos por Instagram y, si te sumás, te asignamos tu
            enlace personal para invitar estudiantes, empresas y comunidades.
          </p>
          <div className="mt-5 flex justify-center">
            <Button variant="primary" size="sm" onClick={requestPromoter}>
              <Send className="h-4 w-4" />
              Solicitar ser promotor
            </Button>
          </div>
          {msgCopied && (
            <p className="mt-3 text-xs text-brand-300">
              Copiamos un mensaje sugerido: pegalo en el chat de Instagram.
            </p>
          )}
        </Card>
      )}

      {/* Ranking de promotores (visible para todos) */}
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-300" />
        <h2 className="text-sm font-semibold text-white">Ranking de promotores</h2>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Promotor</th>
              <th className="px-4 py-3 font-medium text-right">Sumados</th>
              <th className="px-4 py-3 font-medium text-right">Activados</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={`${r.nombre}-${i}`} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-white/50">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-white">{r.nombre}</td>
                <td className="px-4 py-3 text-right font-semibold text-white">{r.total}</td>
                <td className="px-4 py-3 text-right text-white/70">{r.activados}</td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-white/45">
                  Todavía no hay promotores. ¡Podés ser el primero!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
