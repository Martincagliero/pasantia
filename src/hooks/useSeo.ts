import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description: string;
  /** Ruta canónica relativa, ej. "/estudiantes" */
  path?: string;
  image?: string;
}

const SITE_NAME = 'PasantIA';
const BASE_URL = 'https://pasantia.com'; // TODO: reemplazar por el dominio real al publicar.

/**
 * Hook nativo de SEO: setea <title>, meta description y tags Open Graph
 * sin depender de librerías (compatible con React 19 sin SSR).
 */
export function useSeo({ title, description, path = '/', image }: SeoOptions): void {
  useEffect(() => {
    const fullTitle = `${SITE_NAME} | ${title}`;
    document.title = fullTitle;

    const url = `${BASE_URL}${path}`;
    const ogImage = image ?? `${BASE_URL}/og-image.jpg`;

    const meta: Array<[string, string, 'name' | 'property']> = [
      ['description', description, 'name'],
      ['og:title', fullTitle, 'property'],
      ['og:description', description, 'property'],
      ['og:type', 'website', 'property'],
      ['og:url', url, 'property'],
      ['og:image', ogImage, 'property'],
      ['og:site_name', SITE_NAME, 'property'],
      ['twitter:card', 'summary_large_image', 'name'],
      ['twitter:title', fullTitle, 'name'],
      ['twitter:description', description, 'name'],
      ['twitter:image', ogImage, 'name'],
    ];

    const created: HTMLElement[] = [];

    for (const [key, content, attr] of meta) {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        created.push(el);
      }
      el.setAttribute('content', content);
    }

    // Canonical
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
      created.push(canonical);
    }
    canonical.setAttribute('href', url);

    return () => {
      // Limpiamos solo los elementos que creamos en este montaje.
      created.forEach((el) => el.remove());
    };
  }, [title, description, path, image]);
}
