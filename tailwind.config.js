/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f2f6f2',
          100: '#e0eadf',
          200: '#c2d5c1',
          300: '#96b894',
          400: '#649361',
          500: '#436440',
          600: '#345133',
          700: '#2a402a',
          800: '#223422',
          900: '#1b2b1b',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', '"Noto Serif"', 'Georgia', 'serif'],
        sans:  ['"Pretendard"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(67, 100, 64, 0.08)',
        'card-hover': '0 4px 24px 0 rgba(67, 100, 64, 0.14)',
      },
    },
  },
  plugins: [],
};
