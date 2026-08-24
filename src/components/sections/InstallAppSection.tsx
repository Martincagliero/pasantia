import { useState } from 'react';
import { Bell, Check, Download, MoreVertical, Plus, Share2, Smartphone } from 'lucide-react';
import { Section } from '../ui/Section';
import { Reveal } from '../ui/Reveal';
import { Accent } from '../ui/Accent';
import { Button } from '../ui/Button';
import { useEarlyAccess } from '../early-access/EarlyAccess';
import logo from '../../assets/logo.png';

type Platform = 'android' | 'ios';

const STEPS: Record<Platform, string[]> = {
  android: [
    'Abrí PasantIA desde Chrome.',
    'Tocá el menú ⋮ y elegí “Instalar app” o “Agregar a pantalla principal”.',
    'Abrí PasantIA desde el nuevo ícono de inicio.',
    'En Ayuda y soporte, tocá “Activar notificaciones” y elegí Permitir.',
  ],
  ios: [
    'Abrí PasantIA desde Safari.',
    'Tocá Compartir y elegí “Agregar a inicio”.',
    'Abrí PasantIA desde el ícono creado en tu iPhone.',
    'En Ayuda y soporte, tocá “Activar notificaciones” y elegí Permitir.',
  ],
};

export function InstallAppSection() {
  const [platform, setPlatform] = useState<Platform>('android');
  const { open } = useEarlyAccess();
  const isIos = platform === 'ios';

  return (
    <Section id="instalar-app" className="bg-white text-brand-800">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700/55">
            <Download className="h-4 w-4" /> PasantIA en tu celular
          </span>
          <h2 className="mt-5 text-4xl font-semibold tracking-tighter sm:text-6xl">
            Convertí la plataforma <Accent className="!text-brand-600">en una app.</Accent>
          </h2>
          <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-brand-800/70 sm:text-lg">
            No necesitás buscarla en una tienda. Agregá PasantIA a tu pantalla de inicio,
            abrila como cualquier app y recibí avisos de mensajes, conexiones y actividad.
          </p>

          <div className="mt-7 flex w-fit rounded-xl border border-brand-700/15 bg-brand-50 p-1">
            <button
              type="button"
              onClick={() => setPlatform('android')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${platform === 'android' ? 'bg-brand-700 text-white' : 'text-brand-700/60'}`}
            >
              Android
            </button>
            <button
              type="button"
              onClick={() => setPlatform('ios')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${platform === 'ios' ? 'bg-brand-700 text-white' : 'text-brand-700/60'}`}
            >
              iPhone
            </button>
          </div>

          <ol className="mt-7 max-w-xl space-y-3">
            {STEPS[platform].map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-brand-800/70">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => open()} variant="landing" className="!bg-brand-700 !text-white">Registrarme</Button>
            <span className="text-xs text-brand-700/50">Instalable en Android y iPhone.</span>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-full bg-brand-300/20 blur-3xl" />
            <div className="w-[17.5rem] rounded-[2.8rem] border border-white/30 bg-slate-950 p-1.5 shadow-[0_36px_80px_rgba(1,19,84,0.55)] sm:w-[19rem]">
              <div className="relative aspect-[9/18.8] overflow-hidden rounded-[2.4rem] bg-[#eef1f5] text-slate-900">
                <div className="flex h-8 items-center justify-between px-5 text-[8px] font-bold"><span>9:41</span><span>● ●</span></div>
                <div className="flex h-11 items-center gap-2 border-y border-slate-200 bg-white px-3">
                  <img src={logo} alt="PasantIA" className="h-7 w-7 rounded-lg" />
                  <span className="text-[10px] font-bold">PasantIA</span>
                  <Bell className="ml-auto h-4 w-4 text-slate-500" />
                </div>

                <div className="p-4">
                  <div className="rounded-2xl bg-brand-500 p-4 text-white">
                    <Smartphone className="h-6 w-6" />
                    <p className="mt-3 text-sm font-bold">PasantIA lista para instalar</p>
                    <p className="mt-1 text-[9px] leading-relaxed text-white/75">
                      Acceso rápido, pantalla completa y notificaciones.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      {isIos ? <Share2 className="h-4 w-4 text-brand-500" /> : <MoreVertical className="h-4 w-4 text-brand-500" />}
                      <p className="text-[10px] font-bold">{isIos ? 'Menú Compartir' : 'Menú de Chrome'}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-100 p-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white">
                        {isIos ? <Plus className="h-4 w-4 text-brand-500" /> : <Download className="h-4 w-4 text-brand-500" />}
                      </span>
                      <div>
                        <p className="text-[9px] font-bold">{isIos ? 'Agregar a inicio' : 'Instalar app'}</p>
                        <p className="text-[7px] text-slate-400">Creá el acceso directo</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600"><Bell className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><p className="text-[9px] font-bold">Notificaciones activas</p><p className="text-[7px] text-slate-400">Mensajes y solicitudes</p></div>
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center font-['Caveat'] text-lg font-semibold text-brand-700/80">
              se siente como una app, porque lo es
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
