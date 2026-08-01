/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        savr: {
          ink: "#031A12",
          forest: "#067A4A",
          leaf: "#0E9F5F",
          mist: "#F3FAF6",
          signal: "#F5C518",
          night: "#01140E",
          fog: "#DCEFE5",
          mute: "#5C7368",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
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
      },
      animation: {
        rise: "rise 0.55s cubic-bezier(0.22,1,0.36,1) both",
        "rise-delay": "rise 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both",
        "rise-delay-2": "rise 0.55s cubic-bezier(0.22,1,0.36,1) 0.2s both",
        barGrow: "barGrow 0.7s cubic-bezier(0.22,1,0.36,1) both",
        fadeIn: "fadeIn 0.4s ease both",
      },
    },
  },
  plugins: [],
};
