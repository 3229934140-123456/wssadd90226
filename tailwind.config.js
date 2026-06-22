/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          bg: '#0F0F1A',
          surface: '#1A1A2E',
          card: '#252540',
          border: '#3A3A5C',
          mint: '#00D4AA',
          'mint-dark': '#00A888',
          coral: '#FF6B6B',
          'coral-dark': '#E04545',
          gold: '#FFD93D',
          ice: '#4ECDC4',
          text: '#E8E8F0',
          'text-dim': '#8888AA',
          'text-muted': '#5C5C7A',
        },
      },
      fontFamily: {
        timer: ['"DIN Alternate"', '"Roboto Mono"', 'monospace'],
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-border': 'pulseBorder 1.5s ease-in-out infinite',
        'flash-red': 'flashRed 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        pulseBorder: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#FFD93D' },
        },
        flashRed: {
          '0%, 100%': { borderColor: '#FF6B6B' },
          '50%': { borderColor: 'transparent' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
