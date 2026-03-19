/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 uses "class" strategy — we drive it via colorScheme prop on the View
  darkMode: "class",
  content: [
    "./App.{js,ts,tsx}",
    "./app/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
    "./src/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    container: {
      center: true,
      padding: "2rem",
    },
    extend: {
      colors: {
        // ── Shared / brand colors (same in both themes) ──────────
        primary: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
        },
        ring: "#8B5CF6",

        // ── Dark theme tokens ────────────────────────────────────
        // Used as defaults (app is dark-first)
        border: "#334155",
        input: "#1E293B",
        background: "#0F172A",
        foreground: "#FFFFFF",
        secondary: {
          DEFAULT: "#1E293B",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#334155",
          foreground: "#94A3B8",
        },
        popover: {
          DEFAULT: "#1E293B",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1E293B",
          foreground: "#FFFFFF",
        },

        // ── Light theme tokens ───────────────────────────────────
        // Prefixed with "light-" so you can reference them directly
        // if needed, but mainly NativeWind dark: prefix handles switching
        "light-border": "#E2E8F0",
        "light-input": "#F1F5F9",
        "light-background": "#F8FAFC",
        "light-foreground": "#0F172A",
        "light-secondary": "#F1F5F9",
        "light-secondary-foreground": "#1E293B",
        "light-muted": "#E2E8F0",
        "light-muted-foreground": "#64748B",
        "light-card": "#FFFFFF",
        "light-card-foreground": "#0F172A",
        "light-popover": "#FFFFFF",
        "light-popover-foreground": "#0F172A",
      },
      borderRadius: {
        lg: "16px",
        md: "14px",
        sm: "12px",
      },
      boxShadow: {
        glow: "0px 0px 20px rgba(139,92,246,0.4)",
        card: "0px 4px 12px rgba(0,0,0,0.25)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(90deg,#8B5CF6,#A78BFA)",
        "gradient-card": "linear-gradient(180deg,#1E293B,#0F172A)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};