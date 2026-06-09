import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fef3ed",
          100: "#fde6d6",
          500: "#D4541A",
          600: "#B84A13",
          700: "#9a3d0f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
