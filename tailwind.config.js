/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#00A896',
        'brand-dark': '#007566',
        ink: '#1A1A2E',
        cream: '#F8FFFE',
        sun: '#F4A261',
      },
    },
  },
  plugins: [],
};
