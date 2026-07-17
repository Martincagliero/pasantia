import type { ReactNode } from 'react';
import { Reveal } from '../ui/Reveal';
import { Button } from '../ui/Button';
import { Glow } from '../ui/Glow';
import { useEarlyAccess } from '../early-access/EarlyAccess';

interface EarlyAccessCTAProps {
  heading: ReactNode;
  subheading: string;
  /** Rol con el que se abre el formulario (opcional). */
  role?: 'estudiante' | 'empresa';
  buttonLabel?: string;
}

/**
 * CTA final grande antes del footer. Abre el formulario de acceso anticipado
 * (encuesta multi-paso). Las solicitudes llegan por email/servicio de formularios.
 */
export function EarlyAccessCTA({
  heading,
  subheading,
  role,
  buttonLabel = 'Solicitar acceso anticipado',
}: EarlyAccessCTAProps) {
  const { open } = useEarlyAccess();

  return (
    <div className="container-px">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/12 bg-gradient-to-b from-white/[0.09] to-white/[0.03] px-6 py-20 text-center sm:px-16 sm:py-28">
          <Glow className="left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3" />
          <Glow
            className="bottom-0 right-10 h-56 w-56 translate-y-1/3"
            color="rgba(125,156,255,0.25)"
          />

          <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tighter sm:text-6xl">
            {heading}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg font-light text-white/70">
            {subheading}
          </p>
          <div className="mt-10 flex justify-center">
            <Button onClick={() => open(role)} size="lg">
              {buttonLabel}
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
