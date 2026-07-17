/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#F1E3D8",
        ink: "#261C2C",
        aubergine: {
          light: "#6B3D66",
          DEFAULT: "#4A2545",
          dark: "#3A1D38",
        },
        mauve: {
          light: "#A788A7",
          DEFAULT: "#8B6F8B",
          dark: "#6F586F",
        },
        phase: {
          menstruation: "#B8493E",
          follicular: "#6B8F71",
          ovulation: "#D4A24C",
          luteal: "#8B6F8B",
        },
        rose: {
          50: "#FDF2F5",
          100: "#FCE4EA",
          200: "#F6C6D0",
          300: "#E8A0B4",
        },
        wine: {
          light: "#9A4560",
          DEFAULT: "#7A2E45",
          dark: "#5E2136",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
}