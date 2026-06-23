/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          void: 'var(--bg-void)',
          canvas: 'var(--bg-canvas)',
          elevated: 'var(--bg-elevated)',
          glass: 'var(--bg-glass)',
        },
        fg: {
          primary: 'var(--fg-primary)',
          secondary: 'var(--fg-secondary)',
          tertiary: 'var(--fg-tertiary)',
          quaternary: 'var(--fg-quaternary)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          pressed: 'var(--accent-pressed)',
        },
        sig: {
          critical: 'var(--sig-critical)',
          warn: 'var(--sig-warn)',
          watch: 'var(--sig-watch)',
          calm: 'var(--sig-calm)',
          cold: 'var(--sig-cold)',
          violet: 'var(--sig-violet)',
          mute: 'var(--sig-mute)',
        },
        status: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          danger: 'var(--danger)',
          info: 'var(--info)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        tabular: ['Inter Tabular', 'sans-serif'],
      },
      spacing: {
        '0.5': '0.125rem',
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
      },
      boxShadow: {
        glass: 'inset 0 0.5px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.5)',
        'glass-strong': 'inset 0 0.5px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
