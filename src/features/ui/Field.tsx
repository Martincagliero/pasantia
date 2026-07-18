// Primitivas de formulario reutilizables para el sistema interno.
// Estilo coherente con la marca (fondo azul, glass, texto blanco).
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';

const fieldBase =
  'w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/50 focus:bg-white/10 disabled:opacity-50';

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-white/80">
      {children}
    </label>
  );
}

export function TextField({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function TextArea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} min-h-28 resize-y ${className}`} {...props} />;
}

export function SelectField({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${fieldBase} appearance-none bg-[right_1rem_center] bg-no-repeat pr-10 [&>option]:bg-white [&>option]:text-neutral-900 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

/** Contenedor de campo con label + error opcional. */
export function FormRow({
  label,
  htmlFor,
  error,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
    </div>
  );
}
