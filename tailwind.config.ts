import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#023047",
        dark: "#000814",
        cyan: "#219EBC",
        gold: "#FFB703",
        white: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 8, 20, 0.45)",
        "glass-lg": "0 16px 48px rgba(0, 8, 20, 0.55)",
      },
      backdropBlur: {
        glass: "12px",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        ".glass-card": {
          "@apply rounded-2xl border border-white/10 bg-white/5 backdrop-blur-glass shadow-glass":
            {},
        },
        ".glass-card-hover": {
          "@apply glass-card transition-all duration-200 hover:border-cyan/30 hover:bg-white/[0.07] hover:shadow-glass-lg":
            {},
        },
        ".glass-panel": {
          "@apply rounded-2xl border border-white/10 bg-navy/40 backdrop-blur-glass shadow-glass":
            {},
        },
      });
    }),
  ],
};

export default config;
