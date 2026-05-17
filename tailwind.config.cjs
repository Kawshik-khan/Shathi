/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './app/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#22C55E',
          light: '#7ED957',
          soft: '#A7F3A0',
          muted: '#DCFCE7',
        },
        Sathity: {
          50: '#F8FBF8',
          100: '#F5FAF5',
          200: '#EEF7EF',
        },
      },
      borderRadius: {
        '4xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 10px 40px rgba(0,0,0,0.04)',
        glow: '0 6px 20px rgba(34,197,94,0.12)',
      },
    },
  },
  plugins: [],
};

