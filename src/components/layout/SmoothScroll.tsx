import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type Lenis from 'lenis';

/**
 * Scroll suave y "pesado" (estilo Vercel/premium) con Lenis.
 * - Integra el RAF de Lenis con el ticker de GSAP y actualiza ScrollTrigger.
 * - Sube al tope al cambiar de ruta.
 * - Se desactiva si el usuario tiene prefers-reduced-motion (accesibilidad).
 */
export function SmoothScroll() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // En dispositivos táctiles (mobile/tablet) usamos scroll NATIVO: es más
    // fluido y liviano que el scroll sintético de Lenis, que suele "trabar".
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window;

    if (prefersReduced || isTouch) {
      // Sin scroll sintético: solo aseguramos volver al tope por ruta.
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Mobile no descarga ni parsea estas librerías. En Safari usamos scroll
    // nativo; Lenis/GSAP se cargan bajo demanda únicamente en desktop.
    void Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ default: LenisClass }, { default: gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);

        const lenis = new LenisClass({
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.4,
        });

        lenisRef.current = lenis;
        lenis.on('scroll', ScrollTrigger.update);

        const onTick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(onTick);
        gsap.ticker.lagSmoothing(0);

        cleanup = () => {
          gsap.ticker.remove(onTick);
          lenis.destroy();
          lenisRef.current = null;
        };
      })
      .catch(() => {
        // El scroll nativo sigue funcionando si el chunk opcional no carga.
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  // Al cambiar de ruta o hash: scroll al ancla si hay hash, si no al tope.
  useEffect(() => {
    const scrollToHash = () => {
      const el = document.querySelector(hash);
      if (!el) return false;
      if (lenisRef.current) {
        lenisRef.current.scrollTo(el as HTMLElement, { offset: -90 });
      } else {
        (el as HTMLElement).scrollIntoView({ behavior: 'smooth' });
      }
      return true;
    };

    if (hash) {
      // Pequeño delay para asegurar que la sección ya montó (cambio de página).
      const t = setTimeout(scrollToHash, 120);
      return () => clearTimeout(t);
    }

    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [pathname, hash]);

  return null;
}

// Ref module-level para acceder a la instancia desde el efecto de ruta.
const lenisRef: { current: Lenis | null } = { current: null };
