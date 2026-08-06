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
        glass: "var(--shadow)",
        "glass-lg": "var(--shadow-lg)",
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
          "border-radius": "1rem",
          "border": "1px solid var(--border)",
          "background-color": "var(--bg-card)",
          "backdrop-filter": "blur(12px)",
          "box-shadow": "var(--shadow)",
        },
        ".glass-card-hover": {
          "border-radius": "1rem",
          "border": "1px solid var(--border)",
          "background-color": "var(--bg-card)",
          "backdrop-filter": "blur(12px)",
          "box-shadow": "var(--shadow)",
          "transition": "all 200ms",
        },
        ".glass-card-hover:hover": {
          "border-color": "var(--accent-cyan)",
          "box-shadow": "var(--shadow-lg)",
        },
        ".glass-panel": {
          "border-radius": "1rem",
          "border": "1px solid var(--sidebar-border)",
          "background-color": "var(--sidebar-bg)",
          "backdrop-filter": "blur(12px)",
          "box-shadow": "var(--shadow)",
        },
      });
    }),
  ],
};

export default config;