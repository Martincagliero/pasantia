import type { ReactNode } from 'react';
import { Reveal } from '../ui/Reveal';

export interface LegalBlock {
  heading: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  updated: string;
  intro: string;
  blocks: LegalBlock[];
}

/** Layout simple para páginas legales (política, términos). */
export function LegalPage({ title, updated, intro, blocks }: LegalPageProps) {
  return (
    <section className="relative pt-36 pb-28 sm:pt-44">
      <div className="container-px">
        <Reveal className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
            Legales
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-6xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-white/50">Última actualización: {updated}</p>
          <p className="mt-8 text-lg font-light leading-relaxed text-white/70">{intro}</p>

          <div className="mt-12 space-y-10">
            {blocks.map((b, i) => (
              <div key={i}>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {i + 1}. {b.heading}
                </h2>
                <div className="mt-3 space-y-3 text-[15px] font-light leading-relaxed text-white/70">
                  {b.body}
                </div>
              </div>
            ))}
          </div>

          {/* TODO (fase 2): reemplazar por el texto legal definitivo revisado por un profesional. */}
          <p className="mt-14 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/50">
            Este documento es una versión preliminar mientras PasantIA está en etapa de
            acceso anticipado. Su contenido puede actualizarse antes del lanzamiento.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
