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
          dark: '#0f172a',      // Deep slate
          darker: '#020617',    // Darker slate
          slate: '#1e293b',     // Medium slate
          light: '#f8fafc',     // Light slate
          border: '#e2e8f0',    // Soft border
          blue: '#0284c7',      // Primary Ocean Blue
          blueLight: '#38bdf8', // Light Ocean Blue
          blueDark: '#0369a1',  // Dark Ocean Blue
          teal: '#0d9488',      // Primary Teal
          tealLight: '#2dd4bf', // Light Teal
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(14, 165, 233, 0.06)',
        'premium': '0 10px 25px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
        'glow': '0 0 15px 0 rgba(14, 165, 233, 0.3)'
      }
    },
  },
  plugins: [],
}
