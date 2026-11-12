/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#030712',
          900: '#0B0F19',
          800: '#161F33',
        },
      },
    },
  },
  plugins: [],
};

