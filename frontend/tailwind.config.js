/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',   // Emerald light base
          100: '#dcfce7',
          500: '#10b981',  // Emerald theme
          600: '#059669',
          700: '#047857',
        },
        slate: {
          950: '#0b0f19',  // Custom deep dark mode background
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
