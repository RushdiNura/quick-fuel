/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        petrol: { DEFAULT: "#103F38", 2: "#15544A" },
        amber: { DEFAULT: "#F2AA63", dark: "#DB8842" },
        // these five respond to the OS color scheme — see the CSS variables
        // in src/index.css. Brand/semantic colors (petrol, amber, good,
        // warn, bad) stay fixed in both themes, same as the HTML artifact.
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          soft: "rgb(var(--color-ink-soft) / <alpha-value>)",
        },
        line: "rgb(var(--color-line) / <alpha-value>)",
        good: "#268461",
        warn: "#B97818",
        bad: "#BF4940",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: { xl2: "14px" },
    },
  },
  plugins: [],
};
