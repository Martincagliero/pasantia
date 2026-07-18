// Directorio de embajadores: estudiantes y empresas ven todos los embajadores verificados
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { AmbassadorProfile } from '../../lib/database.types';
import { VerifiedBadge } from './VerifiedBadge';
import { orgTypeLabel } from './ambassadorConfig';
import { Section } from '../../components/ui/Section';
import { Reveal } from '../../components/ui/Reveal';
import { Accent } from '../../components/ui/Accent';
import { Button } from '../../components/ui/Button';
import { Mail, Share2, Users, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useEarlyAccess } from '../../components/early-access/EarlyAccess';

export default function AmbassadorDirectory() {
  const { open: openEarlyAccess } = useEarlyAccess();
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('ambassador_profiles')
        .select('*')
        .eq('verified', true)
        .order('created_at', { ascending: false });
      
      if (!active) return;
      setAmbassadors((data as AmbassadorProfile[]) || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Section>
        <div className="text-center text-white/60">Cargando embajadores...</div>
      </Section>
    );
  }

  return (
    <div>
      {/* Header */}
      <Section>
        <Reveal>
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">
              Embajadores <Accent>de PasantIA</Accent>
            </h1>
            <p className="mt-4 text-lg font-light text-white/70">
              Comunidades e influencers que difunden pasantías verificadas
            </p>
          </div>
        </Reveal>

        {/* Qué son los embajadores */}
        <div className="grid gap-6 mb-12 md:grid-cols-3">
          <Reveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20">
                <Users size={24} className="text-brand-300" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Para Comunidades</h3>
              <p className="mt-2 text-sm text-white/70">
                Cuentas de Instagram, grupos de estudiantes, centros de estudiantes que quieren difundir pasantías a su comunidad.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20">
                <TrendingUp size={24} className="text-sky-300" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Ganan Puntos</h3>
              <p className="mt-2 text-sm text-white/70">
                +10 puntos por cada pasantía difundida. Sube de nivel y competí en el ranking contra otros embajadores.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
                <Zap size={24} className="text-violet-300" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Win-Win</h3>
              <p className="mt-2 text-sm text-white/70">
                Las empresas llegan a más estudiantes. Vos ganás visibilidad y reconocimiento en tu comunidad.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Embajadores verificados */}
      {ambassadors.length === 0 ? (
        <Section>
          <Reveal>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-white/40 mb-4" />
              <p className="text-white/60 text-lg">Aún no hay embajadores verificados.</p>
              <Button onClick={() => openEarlyAccess('embajador')} className="mt-4">
                Sé el primero
              </Button>
            </div>
          </Reveal>
        </Section>
      ) : (
        <Section>
          <Reveal>
            <h2 className="text-2xl font-semibold text-white mb-6">Embajadores Verificados</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ambassadors.map((amb) => (
              <Reveal key={amb.id}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 transition-all hover:border-brand-500/50 hover:bg-white/10">
                  {/* Logo/Avatar */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {amb.logo_url ? (
                        <img
                          src={amb.logo_url ?? ''}
                          alt={amb.org_name ?? 'Embajador'}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : null}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {amb.org_name}
                          </h3>
                          <VerifiedBadge verified={amb.verified} small />
                        </div>
                        <p className="text-sm text-white/50">
                          {orgTypeLabel(amb.org_type)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  {amb.description && (
                    <p className="mb-4 text-sm leading-relaxed text-white/70">
                      {amb.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {amb.reach && (
                      <div className="rounded-lg bg-white/5 p-2">
                        <div className="text-xs font-semibold text-brand-400">
                          Alcance
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {amb.reach}
                        </div>
                      </div>
                    )}
                    {amb.university && (
                      <div className="rounded-lg bg-white/5 p-2">
                        <div className="text-xs font-semibold text-brand-400">
                          Universidad
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {amb.university.slice(0, 12)}...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex flex-col gap-2">
                    {amb.instagram_url && (
                      <a
                        href={amb.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg bg-white/10 py-2 transition-colors hover:bg-brand-500/20"
                      >
                        <Share2 size={16} />
                        <span className="text-sm font-medium">Instagram</span>
                      </a>
                    )}
                    <button
                      onClick={() => {
                        const subject = `Contacto - Difusión de pasantías`;
                        const body = `Hola ${amb.org_name},\n\nMe gustaría contactarme con ustedes para difundir pasantías.\n\nSaludos!`;
                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-brand-600/20 py-2 transition-colors hover:bg-brand-600/40"
                    >
                      <Mail size={16} />
                      <span className="text-sm font-medium">Contactar</span>
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      )}
      {/* CTA: Postulate */}
      <Section className="bg-brand-950/30">        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tighter sm:text-5xl">
            ¿Tenés una comunidad o cuenta de <Accent>Instagram?</Accent>
          </h2>
          <p className="mt-4 text-lg font-light text-white/70">
            Únete a los embajadores de PasantIA. Difunde pasantías, gana puntos y sube en el ranking.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => openEarlyAccess('embajador')} size="lg">
              Quiero ser embajador
            </Button>
            <Button variant="secondary" as="link" to="/" size="lg">
              Volver al inicio
            </Button>
          </div>
        </Reveal>
      </Section>
    </div>
  );
}
