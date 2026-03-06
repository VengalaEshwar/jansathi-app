/** @type {import('tailwindcss').Config} */
module.exports = {
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
        border: "#334155",
        input: "#1E293B",
        ring: "#8B5CF6",
        background: "#0F172A",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1E293B",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#334155",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#1E293B",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1E293B",
          foreground: "#FFFFFF",
        },
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