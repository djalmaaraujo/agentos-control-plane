/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--c-bg)',
        panel: 'var(--c-panel)',
        card: 'var(--c-card)',
        'card-hover': 'var(--c-card-hover)',
        border: 'var(--c-border)',
        'border-soft': 'var(--c-border-soft)',
        muted: 'var(--c-muted)',
        faint: 'var(--c-faint)',
        fg: 'var(--c-fg)',
        inset: 'var(--c-inset)',
        hover: 'var(--c-hover)',
        hoverstrong: 'var(--c-hover-strong)',
        accent: '#ff5c33',
        'accent-dim': 'var(--c-accent-dim)'
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
}
