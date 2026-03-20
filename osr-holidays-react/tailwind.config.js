/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d8e8ff',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#13245f',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 35, 95, 0.08)',
      },
      backgroundImage: {
        'hero-overlay': 'linear-gradient(120deg, rgba(10,24,63,0.82) 10%, rgba(37,99,235,0.45) 60%, rgba(10,24,63,0.75) 100%)',
      },
    },
  },
  plugins: [],
}
