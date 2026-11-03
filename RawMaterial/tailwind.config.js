/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Galo brand yellow
        brand: {
          50: "#FFFBEA",
          100: "#FFF3C4",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FACC15",
          500: "#EAB308",
          600: "#CA8A04",
          700: "#A16207",
        },
        // Neutral ink / black scale
        ink: {
          50: "#F7F7F5",
          100: "#EFEFEC",
          200: "#E2E2DE",
          300: "#B4B4AE",
          400: "#7C7C76",
          500: "#55554F",
          600: "#3D3D39",
          700: "#363632",
          800: "#232320",
          900: "#161614",
          950: "#0B0B0A",
        },
        primary: {
          50: "#FFFBEA",
          100: "#FFF3C4",
          500: "#EAB308",
          600: "#CA8A04",
          700: "#A16207",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,11,10,0.06), 0 2px 6px rgba(11,11,10,0.08)",
        pop: "0 10px 30px -10px rgba(11,11,10,0.25)",
      },
      animation: {
        slideDown: "slideDown 0.2s ease",
        fadeIn: "fadeIn 0.4s ease-out",
      },
      keyframes: {
        slideDown: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(-10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
