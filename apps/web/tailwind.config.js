export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          purple: '#6A1B9A',
          red: '#E53935',
          orange: '#F39C12',
          green: '#8BC34A',
          teal: '#5BC0DE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8FAFC',
          soft: '#F1F5F9',
          card: '#FFFFFF',
        },
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'premium': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'glow-purple': '0 0 20px rgba(106, 27, 154, 0.12)',
      },
      borderColor: {
        DEFAULT: '#E2E8F0',
      },
    },
  },
  plugins: [],
}
