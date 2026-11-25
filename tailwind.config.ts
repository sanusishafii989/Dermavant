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
        navy: "#111827",
        dark: "#0B0F17",
        cyan: "#14B8A6",
        gold: "#F59E0B",
        background: "var(--bg-primary)",
        border: "var(--border)",
        input: "var(--bg-input)",
        "accent-cyan": "var(--accent-cyan)",
        "accent-primary": "var(--accent-primary)",
        "accent-gold": "var(--accent-gold)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
        },
        success: {
          DEFAULT: "var(--success)",
          bg: "var(--success-bg)",
          text: "var(--success-text)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          bg: "var(--warning-bg)",
          text: "var(--warning-text)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          bg: "var(--danger-bg)",
          text: "var(--danger-text)",
        },
        info: {
          DEFAULT: "var(--info)",
          bg: "var(--info-bg)",
          text: "var(--info-text)",
        },
        disabled: {
          DEFAULT: "var(--disabled)",
          text: "var(--disabled-text)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
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
          "background-color": "var(--surface)",
          "box-shadow": "var(--shadow)",
        },
        ".glass-card-hover": {
          "border-radius": "1rem",
          "border": "1px solid var(--border)",
          "background-color": "var(--surface)",
          "box-shadow": "var(--shadow)",
          "transition": "border-color 200ms, box-shadow 200ms, transform 200ms",
        },
        ".glass-card-hover:hover": {
          "border-color": "var(--border-hover)",
          "box-shadow": "var(--shadow-lg)",
        },
        ".glass-panel": {
          "border-radius": "1rem",
          "border": "1px solid var(--border)",
          "background-color": "var(--surface-elevated)",
          "box-shadow": "var(--shadow)",
        },
      });
    }),
  ],
};

export default config;
