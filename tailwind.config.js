/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "Rajdhani", "sans-serif"],
        heading: ["Rajdhani", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        body: ["Inter", "Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
}
