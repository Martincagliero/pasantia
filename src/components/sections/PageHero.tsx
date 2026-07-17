import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Glow } from '../ui/Glow';
import { AnimatedHeadline } from '../ui/AnimatedHeadline';
import { useEarlyAccess } from '../early-access/EarlyAccess';

interface PageHeroProps {
  badge: string;
  badgeIcon?: ReactNode;
  headlineLines: ReactNode[];
  subtitle: string;
  role: 'estudiante' | 'empresa';
  ctaLabel?: string;
  image: string;
  imageAlt: string;
  /** Clases de encuadre de la imagen (aspect/object-position). */
  imageClassName?: string;
}

/** Hero compartido para /estudiantes y /empresas (headline + imagen). */
export function PageHero({
  badge,
  badgeIcon,
  headlineLines,
  subtitle,
  role,
  ctaLabel = 'Solicitar acceso anticipado',
  image,
  imageAlt,
  imageClassName = 'aspect-[4/5] object-center sm:aspect-[4/3] lg:aspect-[4/5]',
}: PageHeroProps) {
  const { open } = useEarlyAccess();

  return (
    <section className="relative overflow-hidden pt-36 pb-16 sm:pt-44 sm:pb-24">
      <Glow className="left-1/4 top-10 h-96 w-96" />
      <div className="container-px">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Badge icon={badgeIcon}>{badge}</Badge>
            <AnimatedHeadline
              lines={headlineLines}
              delay={0.15}
              className="mt-6 text-5xl font-semibold tracking-tightest text-white sm:text-6xl lg:text-7xl"
            />
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/70 sm:text-xl"
            >
              {subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75 }}
              className="mt-8"
            >
              <Button onClick={() => open(role)} size="lg">
                {ctaLabel}
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-white/5 blur-3xl" />
            <img
              src={image}
              alt={imageAlt}
              loading="eager"
              decoding="async"
              className={`w-full rounded-[2rem] border border-white/12 object-cover shadow-2xl shadow-brand-950/50 ${imageClassName}`}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
