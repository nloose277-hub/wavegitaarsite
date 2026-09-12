/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Professional neutral palette
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Subtle warm accent — trustworthy, fits music/instruments
        accent: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#f9d8a5',
          300: '#f4bd6e',
          400: '#ef9f3a',
          500: '#e8821a',
          600: '#d96913',
          700: '#b74f16',
          800: '#944018',
          900: '#7a3717',
        },
        success: {
          600: '#16a34a',
          700: '#15803d',
        },
        danger: {
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      maxWidth: {
        'content': '1200px',
      },
    },
  },
  plugins: [],
};
