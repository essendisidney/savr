/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        savr: {
          ink: "#0B1F1A",
          forest: "#145C45",
          leaf: "#1F8A5B",
          mint: "#D8F3E7",
          sand: "#F3EDE3",
          clay: "#C45C26",
          fog: "#E8EEEA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
