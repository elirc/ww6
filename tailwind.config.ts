import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slateBrand: {
          50: "#f6f8fb",
          100: "#e8edf4",
          200: "#cfd9e8",
          300: "#b1c1dc",
          400: "#8ba3c8",
          500: "#5c7ba7",
          600: "#48628a",
          700: "#374c6d",
          800: "#243551",
          900: "#12213a"
        }
      }
    }
  },
  plugins: []
};

export default config;
