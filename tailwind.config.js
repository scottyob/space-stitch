/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Gluten', 'sans-serif'],
      heading: ['Crafty Girls', 'sans-serif'],
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
};
