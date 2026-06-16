/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:      'var(--ink)',
        'ink-2':  'var(--ink-2)',
        'ink-3':  'var(--ink-3)',
        paper:    'var(--paper)',
        'paper-2':'var(--paper-2)',
        velin:    'var(--velin)',
        wax:      'var(--wax)',
        'wax-soft':'var(--wax-soft)',
        'ink-blue':'var(--ink-blue)',
        sage:     'var(--sage)',
        rule:     'var(--rule)',
        'rule-2': 'var(--rule-2)',

        // Aliases sémantiques (compatibilité shadcn/ui)
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card:        { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        primary:     { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary:   { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted:       { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent:      { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)' },
        border:      'var(--border)',
        input:       'var(--input)',
        ring:        'var(--ring)',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
  plugins: [],
};
