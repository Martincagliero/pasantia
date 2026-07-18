/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Breakpoints completos en orden (xs debe ir antes que sm para que
    // `xs:` no gane precedencia sobre `sm:` en pantallas grandes).
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Paleta de marca renovada: Violeta moderno + Índigo para ambiente profesional y acogedor
        // Color primario: Violeta #7C3AED (modern, professional, warm)
        brand: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7', // Color principal - violeta moderno
          600: '#9333EA', // Para hover
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3F0F5C', // Secciones profundas
          DEFAULT: '#A855F7',
        },
        // Colores secundarios para acentos
        accent: {
          primary: '#06B6D4', // Cyan para contrastes
          secondary: '#8B5CF6', // Púrpura adicional
          success: '#10B981', // Verde mint
          warning: '#F59E0B', // Ámbar
          danger: '#EF4444', // Rojo
        },
      },
      fontFamily: {
        // Montserrat en todo el sistema.
        sans: [
          'Montserrat',
          '-apple-system',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.045em',
        tighter: '-0.03em',
      },
      fontSize: {
        // Escala grande estilo Apple para hero
        'display-sm': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-md': ['4.5rem', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-lg': ['6rem', { lineHeight: '0.98', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
