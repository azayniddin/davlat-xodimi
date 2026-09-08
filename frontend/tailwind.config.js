/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: '#0d254c',
          navy: '#0b1b36',
          gold: '#cba052',
          lightGold: '#e8c985',
          accent: '#1e40af',
          emerald: '#059669',
          bg: '#f8fafc'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'gov': '0 4px 20px -2px rgba(13, 37, 76, 0.08), 0 2px 6px -1px rgba(13, 37, 76, 0.04)',
        'gov-lg': '0 10px 30px -4px rgba(13, 37, 76, 0.12), 0 4px 10px -2px rgba(13, 37, 76, 0.06)'
      }
    },
  },
  plugins: [],
}
