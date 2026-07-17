import { motion, type HTMLMotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-[background-color,color,box-shadow,border-color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  // CTA primario: blanco → azul profundo al hover (cambio de color animado).
  primary:
    'bg-white text-brand-600 shadow-lg shadow-brand-950/30 hover:bg-brand-950 hover:text-white hover:shadow-xl hover:shadow-brand-950/50',
  // Secundario glass: transparente → blanco sólido al hover.
  secondary:
    'glass text-white hover:bg-white hover:text-brand-600 hover:border-white',
  // Ghost: gana fondo y color al hover.
  ghost: 'text-white/80 hover:bg-white/10 hover:text-white',
};

const sizes: Record<Size, string> = {
  sm: 'h-10 px-5 text-sm',
  md: 'h-12 px-7 text-[15px]',
  lg: 'h-14 px-9 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps &
  Omit<HTMLMotionProps<'button'>, keyof CommonProps> & {
    as?: 'button';
  };

type ButtonAsLink = CommonProps & {
  as: 'link';
  to: string;
};

type ButtonAsAnchor = CommonProps & {
  as: 'a';
  href: string;
  target?: string;
  rel?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

// Micro-interacción compartida (hover scale sutil, tap scale down).
const interaction = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 22 },
} as const;

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className = '', children } = props;
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (props.as === 'link') {
    return (
      <motion.div {...interaction} className="inline-flex">
        <Link to={props.to} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  if (props.as === 'a') {
    const { href, target, rel } = props;
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        className={classes}
        {...interaction}
      >
        {children}
      </motion.a>
    );
  }

  const { as: _as, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
  return (
    <motion.button className={classes} {...interaction} {...rest}>
      {children}
    </motion.button>
  );
}
