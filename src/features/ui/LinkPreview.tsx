// Tarjeta de vista previa de un link compartido, estilo LinkedIn.
// Muestra el favicon del sitio (imagen por defecto, sin que el usuario suba nada)
// + el dominio + la URL. Diseño minimalista y neutro (sin colores de marca).
import { useState } from 'react';
import { Link2 } from 'lucide-react';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

export function LinkPreview({ url, className = '' }: { url: string; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const domain = getDomain(url);
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-stretch overflow-hidden rounded-xl border border-white/12 bg-white/[0.03] transition hover:bg-white/[0.06] ${className}`}
    >
      <div className="flex w-16 shrink-0 items-center justify-center border-r border-white/10 bg-white/[0.05]">
        {imgError ? (
          <Link2 className="h-6 w-6 text-white/40" />
        ) : (
          <img
            src={favicon}
            alt=""
            className="h-8 w-8 rounded"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="min-w-0 flex-1 px-3.5 py-2.5">
        <p className="truncate text-xs uppercase tracking-wide text-white/45">{domain}</p>
        <p className="truncate text-sm font-medium text-white/85">{url}</p>
        <p className="mt-0.5 text-xs text-white/45">Abrir enlace →</p>
      </div>
    </a>
  );
}
