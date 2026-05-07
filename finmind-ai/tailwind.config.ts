import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':     '#07090f',
        'bg-card':     '#0c0f1a',
        'bg-elevated': '#111420',
        'bg-overlay':  '#181c2a',
        'accent-green': '#00e87a',
        'accent-amber': '#f5a623',
        'accent-red':   '#ff4d6a',
        'accent-blue':  '#4d9fff',
        'text-primary':   '#eef0f8',
        'text-secondary': '#8890a8',
        'text-muted':     '#444d68',
      },
      fontFamily: {
        syne: ['Syne', 'system-ui', 'sans-serif'],
        dm:   ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
        'xs':  ['12px', { lineHeight: '16px' }],
        'sm':  ['14px', { lineHeight: '20px' }],
        'base':['15px', { lineHeight: '24px' }],
        'md':  ['16px', { lineHeight: '24px' }],
        'lg':  ['18px', { lineHeight: '28px' }],
        'xl':  ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
        '6xl': ['60px', { lineHeight: '64px' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'green-glow':  '0 0 0 1px rgba(0,232,122,0.4), 0 0 24px rgba(0,232,122,0.2)',
        'green-glow-lg': '0 0 0 1px rgba(0,232,122,0.5), 0 0 40px rgba(0,232,122,0.25)',
        'card':        '0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover':  '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        'inset-top':   'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
