// Renderiza un texto reemplazando el emoji de advertencia (⚠️) por el SVG propio.
// Se usa sobre todo para los avisos de contenido DEMO guardados en la base.
import { Fragment } from 'react';
import warningIcon from '../../assets/images/emojis/exclamacion.svg';

export function EmojiText({ text }: { text?: string | null }) {
  if (!text) return null;
  if (!text.includes('\u26A0')) return <>{text}</>;
  const parts = text.split(/\u26A0\uFE0F?/g);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <img
              src={warningIcon}
              alt="Advertencia"
              className="mr-0.5 inline-block h-[1em] w-[1em] align-[-0.12em]"
            />
          )}
          {part}
        </Fragment>
      ))}
    </>
  );
}
