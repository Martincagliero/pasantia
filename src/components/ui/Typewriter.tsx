import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypewriterProps {
  words: string[];
  className?: string;
  /** ms por caracter al escribir / borrar. */
  typeSpeed?: number;
  deleteSpeed?: number;
  /** pausa al completar una palabra. */
  holdTime?: number;
}

/**
 * Efecto máquina de escribir: escribe y borra frases en loop.
 * Respeta prefers-reduced-motion (muestra la primera frase fija).
 */
export function Typewriter({
  words,
  className = '',
  typeSpeed = 70,
  deleteSpeed = 40,
  holdTime = 1700,
}: TypewriterProps) {
  const reduce = useReducedMotion();
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) {
      setText(words[0]);
      return;
    }
    const word = words[index % words.length];

    if (!deleting && text === word) {
      const t = setTimeout(() => setDeleting(true), holdTime);
      return () => clearTimeout(t);
    }
    if (deleting && text === '') {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
      return;
    }
    const t = setTimeout(
      () => {
        setText((prev) =>
          deleting ? word.slice(0, prev.length - 1) : word.slice(0, prev.length + 1)
        );
      },
      deleting ? deleteSpeed : typeSpeed
    );
    return () => clearTimeout(t);
  }, [text, deleting, index, words, reduce, typeSpeed, deleteSpeed, holdTime]);

  return (
    <span className={className}>
      {text}
      <span
        aria-hidden
        className="ml-0.5 inline-block w-[0.5ch] animate-pulse font-light text-white/70"
      >
        |
      </span>
    </span>
  );
}
