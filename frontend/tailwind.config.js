/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#f5a623", dark: "#e0951a" },
      },
    },
  },
  plugins: [],
};
