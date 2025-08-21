/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#21009b',
        'brand-orange': '#fd4300',
        'brand-blue-light': '#4338ca',
        'brand-orange-light': '#ff6b35',
      }
    },
  },
  plugins: [],
}