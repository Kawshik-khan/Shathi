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
          DEFAULT: '#5A8D7B',
          light: '#8AB7A6',
          soft: '#CDE2DA',
          muted: '#EBF5F1',
        },
        Sathity: {
          50: '#F8F6F2',
          100: '#F2EFE9',
          200: '#E8E4DD',
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

