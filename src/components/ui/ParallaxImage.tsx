import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Intensidad del parallax en px (desktop). */
  strength?: number;
}

/**
 * Imagen con parallax vertical al hacer scroll (GSAP ScrollTrigger + scrub).
 * En mobile y con prefers-reduced-motion el efecto se desactiva por performance.
 */
export function ParallaxImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  strength = 70,
}: ParallaxImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (reduce || isMobile) return;

    const el = imgRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;

    const tween = gsap.fromTo(
      el,
      { yPercent: -strength / 10 },
      {
        yPercent: strength / 10,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduce, strength]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full scale-110 object-cover ${imgClassName}`}
      />
    </div>
  );
}
