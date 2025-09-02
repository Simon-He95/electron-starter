const animate = require('tailwindcss-animate')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  safelist: ['dark'],
  prefix: '',

  content: ['./src/renderer/src/**/**/*.vue'],

  theme: {},
  plugins: [animate, require('tailwind-scrollbar-hide')]
}
