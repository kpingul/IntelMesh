/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep space dark theme
        void: '#05080c',
        dark: {
          900: '#0a0f16',
          800: '#0f151e',
          700: '#151d29',
          600: '#1a2332',
          500: '#1f2937',
          400: '#374151',
          300: '#4b5563',
          200: '#6b7280',
          100: '#8b9eb0',
        },
        // Electric accent palette
        accent: {
          cyan: '#38bdf8',
          magenta: '#f472b6',
          amber: '#fbbf24',
          emerald: '#34d399',
          violet: '#a78bfa',
          red: '#fb7185',
        },
        // Semantic threat colors
        threat: {
          critical: '#fb7185',
          high: '#f472b6',
          medium: '#fbbf24',
          low: '#34d399',
          info: '#38bdf8',
        }
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(56, 189, 248, 0.35)',
        'glow-magenta': '0 0 20px rgba(244, 114, 182, 0.35)',
        'glow-violet': '0 0 20px rgba(167, 139, 250, 0.35)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-emerald': '0 0 20px rgba(52, 211, 153, 0.3)',
        'glow-red': '0 0 20px rgba(251, 113, 133, 0.3)',
        'elevated': '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 40px rgba(56, 189, 248, 0.05)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #38bdf8, #a78bfa)',
        'gradient-danger': 'linear-gradient(135deg, #fb7185, #f472b6)',
        'gradient-surface': 'linear-gradient(180deg, rgba(56, 189, 248, 0.03) 0%, transparent 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s ease-out forwards',
        'fadeInUp': 'fadeInUp 0.5s ease-out forwards',
        'slideIn': 'slideInRight 0.4s ease-out forwards',
        'slideInLeft': 'slideInLeft 0.4s ease-out forwards',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)' },
          '50%': { boxShadow: '0 0 30px rgba(56, 189, 248, 0.35), 0 0 60px rgba(56, 189, 248, 0.35)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
