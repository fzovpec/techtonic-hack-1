/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kbc: {
          blue: '#00a2e0',
          navy: '#002d5a',
          dark: '#001a35',
          light: '#e8f6fc',
          accent: '#0083ba',
          green: '#00a651',
          gold: '#f5a623',
          card: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'phone': '0 25px 60px -15px rgba(0, 45, 90, 0.35), 0 0 0 12px #1e293b, 0 0 0 14px #334155',
        'subtle': '0 4px 20px -2px rgba(0, 45, 90, 0.08)',
        'glow': '0 0 25px rgba(0, 162, 224, 0.35)',
      }
    },
  },
  plugins: [],
}
