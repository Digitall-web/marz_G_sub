/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#DFF2EB',
        accent: '#B9E5E8',
        secondary: '#7AB2D3',
        primary: '#4A628A',
        success: '#10B981',
        danger: '#EF4444',
        // contextual semantic aliases
        'bg-dark-start': '#0e1726',
        'bg-dark-end': '#0a1020',
      },
      backgroundImage: {
        'gradient-surface': 'linear-gradient(135deg,#DFF2EB 0%,#B9E5E8 60%)',
        'gradient-dark': 'linear-gradient(135deg,#0e1726 0%,#0a1020 70%)',
        'radial-soft': 'radial-gradient(circle at 30% 20%, rgba(185,229,232,0.55), rgba(223,242,235,0) 70%)',
      },
      fontFamily: {
        // system-friendly clean stack, can be replaced with custom later
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '1.25rem',
        'glass': '1.75rem',
      },
      boxShadow: {
        'soft': '0 4px 12px -2px rgba(0,0,0,0.08),0 2px 4px -2px rgba(0,0,0,0.04)',
        'glass': '0 8px 28px -6px rgba(30,41,59,0.20)',
        'inset-faint': 'inset 0 0 0 1px rgba(255,255,255,0.15)',
      },
      backdropBlur: {
        xs: '2px',
        soft: '6px',
      },
      keyframes: {
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-fade-in': {
          '0%': { opacity: '0', transform: 'scale(.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '.65' },
        },
      },
      animation: {
        'fade-slide-up': 'fade-slide-up .5s cubic-bezier(.4,0,.2,1)',
        'scale-fade-in': 'scale-fade-in .4s cubic-bezier(.4,0,.2,1)',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(.4,0,.2,1)',
      },
      spacing: {
        'fluid-gutter': 'clamp(1rem,2.5vw,2rem)',
      },
    },
  },
  plugins: [
    function ({ addComponents, addUtilities, theme }) {
      // Glass card preset + status pills utilities
      addComponents({
        '.glass-card': {
          position: 'relative',
          background: 'rgba(255,255,255,0.55)',
          border: '1px solid rgba(255,255,255,0.6)',
          backdropFilter: 'blur(10px) saturate(140%)',
          WebkitBackdropFilter: 'blur(10px) saturate(140%)',
          borderRadius: theme('borderRadius.glass'),
          boxShadow: theme('boxShadow.glass'),
        },
        '.glass-card-dark': {
          background: 'rgba(20,30,45,0.40)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(14px) saturate(150%)',
          WebkitBackdropFilter: 'blur(14px) saturate(150%)',
          borderRadius: theme('borderRadius.glass'),
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.50)',
        },
      });
      addUtilities({
        '.ring-focus': {
          outline: '2px solid transparent',
          outlineOffset: '2px',
          boxShadow: '0 0 0 3px rgba(122,178,211,0.55)',
        },
        '.ring-focus-dark': {
          outline: '2px solid transparent',
          outlineOffset: '2px',
          boxShadow: '0 0 0 3px rgba(74,98,138,0.70)',
        },
      });
    }
  ],
};