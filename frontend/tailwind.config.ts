import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        outfit: ["var(--font-outfit)", "Outfit", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        bounce: "bounce 1s ease-in-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
