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
          darker: '#080c18',    // Darker slate
          slate: '#1e293b',     // Medium slate
          light: '#f8fafc',     // Light slate
          surface: '#f1f5f9',   // Slightly deeper surface
          border: '#e2e8f0',    // Soft border
          blue: '#0284c7',      // Primary Ocean Blue
          blueLight: '#38bdf8', // Light Ocean Blue
          blueDark: '#0369a1',  // Dark Ocean Blue
          cyan: '#06b6d4',      // Vibrant Cyan
          cyanLight: '#67e8f9', // Light Cyan
          teal: '#0d9488',      // Primary Teal
          tealLight: '#2dd4bf', // Light Teal
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(2, 132, 199, 0.08)',
        'premium': '0 10px 25px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
        'hover': '0 20px 30px -6px rgba(15, 23, 42, 0.09), 0 8px 12px -4px rgba(15, 23, 42, 0.05)',
        'glow': '0 0 20px 0 rgba(2, 132, 199, 0.25)',
        'cyan-glow': '0 0 20px 0 rgba(6, 182, 212, 0.3)'
      }
    },
  },
  plugins: [],
}
