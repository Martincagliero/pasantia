import { useEffect, useState } from 'react';

const LAUNCH_DATE = new Date('2026-09-01T00:00:00-03:00').getTime();

function remainingTime() {
  const distance = Math.max(LAUNCH_DATE - Date.now(), 0);
  return {
    launched: distance === 0,
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
  };
}

export function LaunchCountdown({ compact = false }: { compact?: boolean }) {
  const [remaining, setRemaining] = useState(remainingTime);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(remainingTime()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (remaining.launched) {
    return <span className="text-xs font-semibold text-white sm:text-sm">PasantIA ya está disponible</span>;
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`} aria-label={`Faltan ${remaining.days} días, ${remaining.hours} horas y ${remaining.minutes} minutos para el lanzamiento`}>
      <span className="whitespace-nowrap text-[10px] font-semibold uppercase text-white/65 sm:text-xs">
        Lanzamiento<br />1 de septiembre
      </span>
      <div className="flex items-center gap-1">
        {[
          [remaining.days, 'días'],
          [remaining.hours, 'hs'],
          [remaining.minutes, 'min'],
        ].map(([value, label]) => (
          <span key={label} className="min-w-9 rounded-lg border border-white/15 bg-white/10 px-1.5 py-1 text-center">
            <strong className="block text-xs font-semibold tabular-nums text-white sm:text-sm">{String(value).padStart(2, '0')}</strong>
            <span className="block text-[8px] uppercase text-white/50">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}