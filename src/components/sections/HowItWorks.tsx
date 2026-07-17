import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Reveal } from '../ui/Reveal';
import { ParallaxImage } from '../ui/ParallaxImage';
import { staggerContainer, fadeUp, viewportOnce } from '../../lib/motion';

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

/**
 * Sección "Cómo funciona" en pasos numerados (1..N), alternando el lado
 * de la imagen. Cada paso se revela al entrar al viewport y la imagen
 * tiene parallax sutil al scrollear.
 */
export function HowItWorks({ eyebrow, heading, subheading, steps }: HowItWorksProps) {
  const reduce = useReducedMotion();

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

      <div className="mt-16 flex flex-col gap-20 sm:mt-24 sm:gap-28">
        {steps.map((step, i) => {
          const reversed = i % 2 === 1;
          const num = String(i + 1).padStart(2, '0');
          return (
            <div
              key={step.title}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                reversed ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              {/* Texto */}
              <motion.div
                variants={staggerContainer(0.08)}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                <motion.span
                  variants={fadeUp}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl glass text-2xl font-bold tabular-nums text-white"
                >
                  {num}
                </motion.span>
                <motion.h3
                  variants={fadeUp}
                  className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                  {step.title}
                </motion.h3>
                <motion.p
                  variants={fadeUp}
                  className="mt-4 max-w-md text-lg font-light leading-relaxed text-white/70"
                >
                  {step.description}
                </motion.p>
              </motion.div>

              {/* Visual con parallax */}
              <Reveal delay={0.1}>
                <div className="relative">
                  <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-white/5 blur-2xl" />
                  <ParallaxImage
                    src={step.image}
                    alt={step.imageAlt}
                    strength={reduce ? 0 : 60}
                    className="aspect-[4/3] rounded-[1.75rem] border border-white/10 shadow-2xl shadow-brand-950/40"
                  />
                </div>
              </Reveal>
            </div>
          );
        })}
      </div>
    </div>
  );
}
