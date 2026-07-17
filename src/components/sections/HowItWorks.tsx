import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { Reveal } from '../ui/Reveal';
import { viewportOnce } from '../../lib/motion';

export interface Step {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

interface HowItWorksProps {
  eyebrow: string;
  heading: ReactNode;
  subheading?: string;
  steps: Step[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Sección "Cómo funciona" como scrollytelling: en desktop una imagen sticky
 * hace crossfade entre pasos a medida que se scrollea la lista, con una línea
 * de progreso que se llena y el paso activo resaltado. En mobile, los pasos
 * se apilan con su imagen y animaciones de entrada.
 */
export function HowItWorks({ eyebrow, heading, subheading, steps }: HowItWorksProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ['start 55%', 'end 55%'],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

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

      <div className="mt-14 sm:mt-20 lg:grid lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        {/* ---- Media sticky (solo desktop) ---- */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-brand-950/40">
              {steps.map((s, i) => (
                <motion.img
                  key={s.title}
                  src={s.image}
                  alt={s.imageAlt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={false}
                  animate={{
                    opacity: active === i ? 1 : 0,
                    scale: active === i ? 1 : reduce ? 1 : 1.06,
                  }}
                  transition={{ duration: 0.7, ease: EASE }}
                />
              ))}

              {/* Velo degradado para legibilidad del overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/80 via-transparent to-transparent" />

              {/* Overlay: título + segmentos de progreso */}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                  <motion.span
                    key={active}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    {steps[active]?.title}
                  </motion.span>
                  <span className="tabular-nums text-white/50">
                    {String(active + 1).padStart(2, '0')} /{' '}
                    {String(steps.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {steps.map((s, i) => (
                    <span
                      key={s.title}
                      className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                    >
                      <motion.span
                        className="block h-full rounded-full bg-white"
                        initial={false}
                        animate={{ width: i <= active ? '100%' : '0%' }}
                        transition={{ duration: 0.5, ease: EASE }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Lista de pasos ---- */}
        <div ref={listRef} className="relative mt-12 lg:mt-0">
          {/* Línea de progreso vertical (desktop) */}
          <div className="absolute left-6 top-6 bottom-6 hidden w-px bg-white/12 lg:block">
            <motion.div
              className="h-full w-full origin-top rounded-full bg-white/70"
              style={{ scaleY: lineScale }}
            />
          </div>

          <div className="flex flex-col gap-12 lg:gap-[38vh] lg:py-[6vh]">
            {steps.map((s, i) => {
              const activeNow = active === i;
              return (
                <motion.div
                  key={s.title}
                  onViewportEnter={() => setActive(i)}
                  viewport={{ margin: '-45% 0px -45% 0px' }}
                  className="relative lg:pl-16"
                >
                  {/* Número */}
                  <motion.span
                    initial={false}
                    animate={{ scale: activeNow ? 1 : 0.92 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className={`relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-bold tabular-nums transition-colors duration-500 lg:absolute lg:left-0 lg:top-0 ${
                      activeNow
                        ? 'border-white bg-white text-brand-600 shadow-lg shadow-brand-950/40'
                        : 'border-white/15 bg-white/[0.06] text-white/70'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </motion.span>

                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{ duration: 0.6, ease: EASE }}
                    className={`mt-5 text-2xl font-semibold tracking-tight transition-colors duration-500 xs:text-3xl sm:text-4xl lg:mt-0 ${
                      activeNow ? 'text-white' : 'lg:text-white/45'
                    }`}
                  >
                    {s.title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{ duration: 0.6, delay: 0.06, ease: EASE }}
                    className={`mt-3 max-w-md text-base font-light leading-relaxed transition-colors duration-500 sm:text-lg ${
                      activeNow ? 'text-white/70' : 'lg:text-white/40'
                    }`}
                  >
                    {s.description}
                  </motion.p>

                  {/* Imagen inline (solo mobile/tablet) */}
                  <motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={viewportOnce}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="mt-6 lg:hidden"
                  >
                    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-2xl shadow-brand-950/40">
                      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-white/5 blur-2xl" />
                      <img
                        src={s.image}
                        alt={s.imageAlt}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
