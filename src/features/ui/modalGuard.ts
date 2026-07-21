// Registro global de modales abiertos: sirve para ocultar el widget de mensajes
// mientras haya algo abierto (para que no se interponga).
import { useEffect, useState } from 'react';

let openCount = 0;
const listeners = new Set<(n: number) => void>();

function emit() {
  for (const l of listeners) l(openCount);
}

/** Llamar dentro de un modal: mientras esté montado, cuenta como "modal abierto". */
export function useModalGuard(active = true) {
  useEffect(() => {
    if (!active) return;
    openCount += 1;
    emit();
    return () => {
      openCount = Math.max(0, openCount - 1);
      emit();
    };
  }, [active]);
}

/** Devuelve true si hay al menos un modal abierto. */
export function useAnyModalOpen(): boolean {
  const [n, setN] = useState(openCount);
  useEffect(() => {
    const l = (v: number) => setN(v);
    listeners.add(l);
    setN(openCount);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return n > 0;
}
