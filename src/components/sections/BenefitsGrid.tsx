import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Reveal } from '../ui/Reveal';
import { staggerContainer, fadeUp, viewportOnce } from '../../lib/motion';

export interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface BenefitsGridProps {
  eyebrow: string;
  heading: ReactNode;
  subheading?: string;
  benefits: Benefit[];
}

/** Grid de tarjetas de beneficios con ícono + texto, reveladas en cascada. */
export function BenefitsGrid({ eyebrow, heading, subheading, benefits }: BenefitsGridProps) {
  return (
    <div className="container-px">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
          {eyebrow}
        </span>
        <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
          {heading}
        </h2>
        {subheading && (
          <p className="mt-5 text-lg font-light text-white/70">{subheading}</p>
        )}
      </Reveal>

      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
      >
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div key={b.title} variants={fadeUp} className="relative h-full">
              <div
                className={`relative flex h-full items-start gap-4 rounded-[1.6rem] rounded-bl-md p-5 backdrop-blur-xl transition-colors sm:flex-col sm:items-start sm:gap-0 sm:p-6 ${
                  i % 2 === 0
                    ? 'border border-white/15 bg-white/[0.08] hover:bg-white/[0.12]'
                    : 'border border-brand-300/30 bg-brand-400/25 hover:bg-brand-400/30'
                }`}
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white sm:h-12 sm:w-12">
                  <Icon size={22} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight sm:mt-6 sm:text-xl">
                    {b.title}
                  </h3>
                  <p className="mt-1 text-sm font-light leading-relaxed text-white/70 sm:mt-3 sm:text-[15px]">
                    {b.description}
                  </p>
                </div>
              </div>
              {/* Colita del globo de chat */}
              <span
                aria-hidden
                className={`absolute -bottom-1 left-5 h-4 w-4 rotate-45 rounded-[5px] ${
                  i % 2 === 0 ? 'bg-white/[0.08]' : 'bg-brand-400/25'
                }`}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
