/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{html,vue,js,ts,jsx,tsx}', './components/**/*.{html,vue,js,ts,jsx,tsx}', './pages/**/*.{html,vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': '#3b82f6',
        'secondary': '#64748b',
        'light-indigo': '#e3dcff',
        'yellow-love': '#f4a62a',
        'clr-default1': '#000000',
        'clr-secondary': '#F2D671',
        'clr-svg-primary': '#0F7818',
        'clr-svg-scd': '#FF0000',
        'clr-svg-three': '#334E81',
        'bg-modal': 'rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
