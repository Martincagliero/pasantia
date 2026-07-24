// Estudiante: sección "Promotores".
// Cada estudiante tiene su enlace personal (?ref=CODIGO). Acá ve su enlace,
// lo puede copiar/compartir y ve cuánta gente trajo (solo sus totales).
import { useEffect, useState } from 'react';
import { Copy, Check, Share2, Users, Building2, Megaphone, UserCheck, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader, PageLoader } from '../ui/primitives';

interface Stats {
  total: number;
  estudiantes: number;
  empresas: number;
  embajadores: number;
  activados: number;
}

const EMPTY_STATS: Stats = {
  total: 0,
  estudiantes: 0,
  empresas: 0,
  embajadores: 0,
  activados: 0,
};

export default function Promoters() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string>('');
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [copied, setCopied] = useState(false);

  const link = code ? `${window.location.origin}/?ref=${code}` : '';

  useEffect(() => {
    let active = true;
    (async () => {
      // Genera (o recupera) el código del estudiante y trae sus totales.
      const [{ data: codeData }, { data: statsData }] = await Promise.all([
        supabase.rpc('ensure_my_referral_code'),
        supabase.rpc('my_referral_stats'),
      ]);
      if (!active) return;

      if (typeof codeData === 'string') setCode(codeData);

      const row = Array.isArray(statsData) ? statsData[0] : statsData;
      if (row) {
        setStats({
          total: Number(row.total ?? 0),
          estudiantes: Number(row.estudiantes ?? 0),
          empresas: Number(row.empresas ?? 0),
          embajadores: Number(row.embajadores ?? 0),
          activados: Number(row.activados ?? 0),
        });
      }
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
      /* ignore: si el navegador no permite copiar, el usuario puede seleccionarlo */
    }
  }

  async function share() {
    if (!link) return;
    const shareData = {
      title: 'Sumate a Pasantía',
      text: 'Estamos construyendo Pasantía para acercar las primeras experiencias laborales a estudiantes. ¡Sumate con mi enlace!',
      url: link,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyLink();
      }
    } catch {
      /* el usuario canceló el compartir */
    }
  }

  if (loading) return <PageLoader />;

  const metrics = [
    { label: 'Total', value: stats.total, icon: Users },
    { label: 'Estudiantes', value: stats.estudiantes, icon: Users },
    { label: 'Empresas', value: stats.empresas, icon: Building2 },
    { label: 'Comunidades', value: stats.embajadores, icon: Megaphone },
    { label: 'Ya activados', value: stats.activados, icon: UserCheck },
  ];

  return (
    <div>
      <PageHeader
        title="Promotores"
        description="Ayudanos a construir Pasantía. Compartí tu enlace y seguí cuánta gente sumás."
      />

      {/* Enlace personal */}
      <Card className="mb-5">
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
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-brand-300">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="mt-0.5 text-xs text-white/55">{label}</p>
          </Card>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-white/45">
        Los datos personales de quienes se suman son privados. Acá solo ves tus totales.
      </p>
    </div>
  );
}
