/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        savr: {
          ink: "#0B1220",
          forest: "#00C853",
          leaf: "#00E676",
          mist: "#F8FAFC",
          signal: "#F5C518",
          accent: "#2563EB",
          night: "#09090B",
          fog: "#E8EEF2",
          mute: "#64748B",
        },
      },
      borderRadius: {
        card: "1.25rem",
        "card-lg": "1.5rem",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        brand: "-0.04em",
        tightish: "-0.02em",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        barGrow: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.015)" },
        },
      },
      animation: {
        rise: "rise 0.55s cubic-bezier(0.22,1,0.36,1) both",
        "rise-delay": "rise 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both",
        "rise-delay-2": "rise 0.55s cubic-bezier(0.22,1,0.36,1) 0.2s both",
        barGrow: "barGrow 0.7s cubic-bezier(0.22,1,0.36,1) both",
        fadeIn: "fadeIn 0.4s ease both",
        breathe: "breathe 3.2s ease-in-out infinite",
      },
      transitionDuration: {
        soft: "250ms",
      },
    },
  },
  plugins: [],
};
