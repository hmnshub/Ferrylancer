/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        ink: '#0B1220',
        muted: '#5B6478',
        surface: '#FFFFFF',
        cloud: '#F4F7FF',
        mist: '#EAF0FF',
        blue: {
          50: '#EEF3FF',
          100: '#DCE6FF',
          400: '#3D6BF0',
          500: '#1E4FE0',
          600: '#123FC2',
          700: '#0B2E96',
          900: '#081B57',
        },
        flag: {
          crimson: '#E23744',
          saffron: '#F5A623',
          gold: '#FFC93C',
          leaf: '#1DA463',
          violet: '#7C5CFC',
        },
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(11,46,150,0.25)',
        card: '0 2px 10px -2px rgba(11,18,32,0.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      maxWidth: {
        'container-max': '1280px',
      },
    },
  },
  plugins: [],
}
