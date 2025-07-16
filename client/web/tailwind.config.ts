import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vapi: {
          background: "#0E0F14",
          surface: "#1C1F26",
          border: "#2A2D34",
          text: "#E5E7EB",
          blue: "#3F8CFF",
          blueHover: "#297aff",
          green: "#36C488",
          red: "#FF5F5F",
          redBg: "#2B1212",
          greenBg: "#142029",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
