import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Reveal } from '../ui/Reveal';
import { Accent } from '../ui/Accent';
import { Button } from '../ui/Button';
import { useEarlyAccess } from '../early-access/EarlyAccess';

const EASE = [0.22, 1, 0.36, 1] as const;

const face = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&h=240&q=80&crop=faces`;

interface FloatItem {
  src: string;
  /** Clases de posición (top/left/right/bottom + translate). */
  pos: string;
  size: string;
  delay: number;
}

const FLOATERS: FloatItem[] = [
  { src: face('photo-1494790108377-be9c29b29330'), pos: 'left-1/2 top-[4%] -translate-x-1/2', size: 'h-12 w-12 md:h-20 md:w-20', delay: 0 },
  { src: face('photo-1500648767791-00dcc994a43e'), pos: 'left-[6%] top-[16%]', size: 'h-10 w-10 md:h-16 md:w-16', delay: 0.06 },
  { src: face('photo-1544005313-94ddf0286df2'), pos: 'right-[5%] top-[11%]', size: 'h-14 w-14 md:h-24 md:w-24', delay: 0.12 },
  { src: face('photo-1507003211169-0a1dd7228f2d'), pos: 'left-[3%] top-1/2', size: 'h-9 w-9 md:h-14 md:w-14', delay: 0.18 },
  { src: face('photo-1506794778202-cad84cf45f1d'), pos: 'right-[3%] top-[52%]', size: 'h-12 w-12 md:h-20 md:w-20', delay: 0.24 },
  { src: face('photo-1438761681033-6461ffad8d80'), pos: 'left-[16%] bottom-[6%]', size: 'h-10 w-10 md:h-16 md:w-16', delay: 0.3 },
  { src: face('photo-1534528741775-53994a69daeb'), pos: 'right-[18%] bottom-[5%]', size: 'h-14 w-14 md:h-24 md:w-24', delay: 0.36 },
];

/** Avatar flotante con entrada y flotación infinita. */
function Floater({ item, reduce }: { item: FloatItem; reduce: boolean | null }) {
  return (
    <motion.div
      className={`absolute ${item.pos}`}
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, delay: item.delay, ease: EASE }}
    >
      <motion.img
        src={item.src}
        alt=""
        aria-hidden
        loading="lazy"
        animate={reduce ? undefined : { y: [0, -12, 0] }}
        transition={{ duration: 5 + item.delay * 4, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
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
        style={reduce ? undefined : { scale: clusterScale }}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        {FLOATERS.map((item) => (
          <Floater key={item.src} item={item} reduce={reduce} />
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
          <Button onClick={() => open()} size="lg">
            Sumate al acceso anticipado
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
