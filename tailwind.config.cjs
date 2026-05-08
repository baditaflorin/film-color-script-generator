/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,html}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      colors: {
        ink: "#18221d",
        moss: "#285f4e",
        fern: "#3d8b63",
        paper: "#f8f5ed",
        clay: "#d9825b",
        plum: "#68506f",
        skywash: "#d7e6eb"
      },
      boxShadow: {
        panel: "0 18px 55px rgb(30 42 35 / 0.14)"
      }
    }
  },
  plugins: []
};
