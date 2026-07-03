/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#070c12', 800: '#0b131c', 700: '#111c28', 600: '#182636' },
        mint: { 300: '#7ff0c8', 400: '#34e0a1', 500: '#12c98a', 600: '#0aa876' },
        aqua: { 400: '#38bdf8', 500: '#0ea5e9' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(52,224,161,0.45)',
        card: '0 8px 30px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
