/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'army-dark': '#1a2234',
        'army-green': {
          50: '#f0f7f0',
          100: '#d9eed9',
          200: '#b4dcb4',
          300: '#82c382',
          400: '#52a452',
          500: '#3a8a3a',
          600: '#2d6e2d',
          700: '#245824',
          800: '#1e471e',
          900: '#193b19',
        },
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
