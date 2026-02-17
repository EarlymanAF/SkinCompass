import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: false, // ⛔ deaktiviert Dark Mode komplett
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        foreground: "var(--foreground)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        border: "var(--border)",
        "accent-from": "var(--accent-from)",
        "accent-to": "var(--accent-to)",
      },
      fontFamily: {
        sans: ["\"Inter var\"", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        button: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.08)",
        active: "0 12px 24px rgba(20, 184, 166, 0.25)",
      },
      keyframes: {
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        "gradient-shift": "gradientShift 25s ease infinite",
        float: "float 20s ease-in-out infinite",
        wiggle: "wiggle 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
