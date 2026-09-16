/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0b',
        panel: '#0f0f10',
        card: '#131315',
        'card-hover': '#17171a',
        border: '#242427',
        'border-soft': '#1c1c1f',
        muted: '#8a8a92',
        faint: '#5c5c63',
        accent: '#ff5c33',
        'accent-dim': 'rgba(255, 92, 51, 0.12)'
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
}
