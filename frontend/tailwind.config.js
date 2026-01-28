/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fragment Mono', 'SF Mono', 'Monaco', 'Courier New', 'monospace'],
        mono: ['Fragment Mono', 'SF Mono', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px'],
        lg: ['15px', '22px'],
        xl: ['17px', '26px'],
        '2xl': ['20px', '28px'],
      },
    },
  },
  plugins: [],
}
