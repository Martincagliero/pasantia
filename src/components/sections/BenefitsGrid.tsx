import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
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
        className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {benefits.map((b) => {
          const Icon = b.icon;
          return (
            <motion.div key={b.title} variants={fadeUp}>
              <GlassCard interactive className="h-full">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Icon size={22} />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-white/65">
                  {b.description}
                </p>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
