/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f7',
          100: '#d7e0ec',
          200: '#b0c2da',
          300: '#88a3c7',
          400: '#5f85b4',
          500: '#3d6494',
          600: '#2c4d76',
          700: '#1f3a5c',
          800: '#152943',
          900: '#0d1b2e',
          950: '#070f1a',
        },
        teal: {
          50: '#eafbf9',
          100: '#c9f3ee',
          200: '#93e6dc',
          300: '#5cd3c5',
          400: '#31b8ab',
          500: '#1c9c90',
          600: '#167d74',
          700: '#15645e',
          800: '#14504c',
          900: '#134240',
          950: '#062725',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(13, 27, 46, 0.08), 0 1px 2px -1px rgba(13, 27, 46, 0.08)',
        'card-hover': '0 10px 25px -5px rgba(13, 27, 46, 0.12), 0 8px 10px -6px rgba(13, 27, 46, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
