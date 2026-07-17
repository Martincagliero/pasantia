/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul de marca extraído del logo real (loog.png) = #0148FD
        brand: {
          50: '#EBF0FF',
          100: '#D6E1FF',
          200: '#ADC2FF',
          300: '#7D9CFF',
          400: '#4A73FF',
          500: '#0148FD', // DEFAULT — fondo base de la web
          600: '#0139D6',
          700: '#012BA8',
          800: '#02207E',
          900: '#03175A',
          950: '#020E38', // secciones profundas
          DEFAULT: '#0148FD',
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
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
};
