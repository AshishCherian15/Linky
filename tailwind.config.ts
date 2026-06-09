/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Outfit', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: { accent: 'var(--accent)' },
      borderRadius: { '2xl': '16px', '3xl': '20px', '4xl': '24px' },
      keyframes: {
        rise: {
          '0%':   { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        riseStagger: {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.93) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1)   translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-7px)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.04)' },
        },
        spinSlow: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        rise:        'rise 520ms cubic-bezier(0.22,1,0.36,1) both',
        riseStagger: 'riseStagger 420ms cubic-bezier(0.22,1,0.36,1) both',
        fadeIn:      'fadeIn 300ms ease both',
        scaleIn:     'scaleIn 230ms cubic-bezier(0.22,1,0.36,1) both',
        slideUp:     'slideUp 280ms cubic-bezier(0.22,1,0.36,1) both',
        float:       'float 4s ease-in-out infinite',
        breathe:     'breathe 3s ease-in-out infinite',
        spinSlow:    'spinSlow 9s linear infinite',
      },
    },
  },
  plugins: [],
}
