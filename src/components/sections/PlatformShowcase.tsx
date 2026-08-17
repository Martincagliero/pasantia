import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Reveal } from '../ui/Reveal';
import { Accent } from '../ui/Accent';
import { Button } from '../ui/Button';
import { useEarlyAccess } from '../early-access/EarlyAccess';
import { AVATARS } from '../../lib/images';

const EASE = [0.22, 1, 0.36, 1] as const;

interface FloatItem {
  src: string;
  /** Clases de posición (top/left/right/bottom + translate). */
  pos: string;
  size: string;
  delay: number;
}

const FLOATERS: FloatItem[] = [
  { src: AVATARS[0], pos: 'left-1/2 top-[4%] -translate-x-1/2', size: 'h-12 w-12 md:h-20 md:w-20', delay: 0 },
  { src: AVATARS[1], pos: 'left-[6%] top-[16%]', size: 'h-10 w-10 md:h-16 md:w-16', delay: 0.06 },
  { src: AVATARS[2], pos: 'right-[5%] top-[11%]', size: 'h-14 w-14 md:h-24 md:w-24', delay: 0.12 },
  { src: AVATARS[3], pos: 'left-[3%] top-1/2', size: 'h-9 w-9 md:h-14 md:w-14', delay: 0.18 },
  { src: AVATARS[1], pos: 'right-[3%] top-[52%]', size: 'h-12 w-12 md:h-20 md:w-20', delay: 0.24 },
  { src: AVATARS[2], pos: 'left-[16%] bottom-[6%]', size: 'h-10 w-10 md:h-16 md:w-16', delay: 0.3 },
  { src: AVATARS[0], pos: 'right-[18%] bottom-[5%]', size: 'h-14 w-14 md:h-24 md:w-24', delay: 0.36 },
];

/** Avatar flotante con entrada y flotación infinita. */
function Floater({ item, staticMotion }: { item: FloatItem; staticMotion: boolean }) {
  return (
    <motion.div
      className={`absolute ${item.pos}`}
      initial={staticMotion ? false : { opacity: 0, scale: 0 }}
      whileInView={staticMotion ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={staticMotion ? undefined : { duration: 0.6, delay: item.delay, ease: EASE }}
    >
      <img
        src={item.src}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className={`${item.size} rounded-full border border-white/20 object-cover shadow-xl shadow-brand-950/50`}
      />
    </motion.div>
  );
}

/**
 * Sección "Por qué PasantIA" — estilo go-marz: un titular central con avatares
 * circulares alrededor. Al scrollear hacia abajo se juntan al centro y al subir
 * se separan (movimiento radial, no lateral), escalando el cluster desde su centro.
 */
export function PlatformShowcase() {
  const reduce = useReducedMotion();
  const [limitMotion] = useState(() =>
    window.matchMedia('(pointer: coarse), (max-width: 768px)').matches
  );
  const staticMotion = Boolean(reduce || limitMotion);
  const { open } = useEarlyAccess();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // Radial: separados al entrar/subir (>1) -> juntos al centro al bajar (<1).
  const clusterScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.18, 1, 0.3]);

  return (
    <div ref={ref} className="relative">
      {/* Avatares: convergen/divergen del centro con el scroll (mobile + desktop) */}
      <motion.div
        style={staticMotion ? undefined : { scale: clusterScale }}
        animate={staticMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        {FLOATERS.map((item) => (
          <Floater key={`${item.src}-${item.pos}`} item={item} staticMotion={staticMotion} />
        ))}
      </motion.div>

      {/* Contenido central */}
      <div className="relative mx-auto flex min-h-[30rem] max-w-xl flex-col items-center justify-center py-6 text-center md:min-h-[36rem] md:py-16">
        <Reveal>
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
            Por qué PasantIA
          </span>
          <h2 className="mt-4 text-4xl font-semibold tracking-tighter xs:text-5xl sm:text-6xl">
            Dos mundos,{' '}
            <Accent>un mismo lugar.</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base font-light leading-relaxed text-white/70 sm:text-lg">
            Conexiones relevantes, empresas verificadas y una experiencia ágil y
            simple para tu primera pasantía.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <Button onClick={() => open()} variant="landing" size="lg">
            Sumate al acceso anticipado
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
