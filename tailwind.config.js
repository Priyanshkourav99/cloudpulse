/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1a1f3a',
          900: '#12162b',
          950: '#0d1020',
        },
      },
    },
  },
  plugins: [],
};
