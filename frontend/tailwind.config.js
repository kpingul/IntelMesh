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
        // Refined paper & ink light theme
        paper: {
          50: '#FDFCFB',
          100: '#FAF9F7',
          200: '#F5F3F0',
          300: '#EBE8E4',
          400: '#DED9D3',
          500: '#C7C1B9',
        },
        ink: {
          900: '#1A1915',
          800: '#2D2B26',
          700: '#3D3A33',
          600: '#5C5850',
          500: '#7A756A',
          400: '#9B9589',
          300: '#B8B3A8',
          200: '#D4D0C7',
          100: '#E8E5DE',
        },
        // Accent palette - refined & purposeful
        accent: {
          coral: '#E85D4C',
          terracotta: '#C94D38',
          amber: '#D4940A',
          gold: '#B8860B',
          teal: '#0F8B8D',
          ocean: '#2563EB',
          indigo: '#4F46E5',
          violet: '#7C3AED',
          slate: '#475569',
        },
        // Semantic threat colors
        threat: {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#D97706',
          low: '#059669',
          info: '#0EA5E9',
        }
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(26, 25, 21, 0.05), 0 1px 2px rgba(26, 25, 21, 0.03)',
        'card': '0 4px 12px rgba(26, 25, 21, 0.08), 0 1px 3px rgba(26, 25, 21, 0.05)',
        'elevated': '0 8px 24px rgba(26, 25, 21, 0.12), 0 2px 8px rgba(26, 25, 21, 0.06)',
        'float': '0 12px 40px rgba(26, 25, 21, 0.15), 0 4px 12px rgba(26, 25, 21, 0.08)',
        'inner-soft': 'inset 0 1px 2px rgba(26, 25, 21, 0.04)',
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #FAF9F7 0%, #F5F3F0 100%)',
        'gradient-accent': 'linear-gradient(135deg, #E85D4C 0%, #D4940A 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(232, 93, 76, 0.03) 0%, transparent 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'fadeInUp': 'fadeInUp 0.6s ease-out forwards',
        'slideIn': 'slideInRight 0.4s ease-out forwards',
        'slideInLeft': 'slideInLeft 0.4s ease-out forwards',
        'slideDown': 'slideDown 0.3s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
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
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
}
