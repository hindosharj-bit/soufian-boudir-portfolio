/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0a0a0f",
        "deep-blue": "#1a1a2e",
        "neon-blue": "#00f3ff",
        "cyber-blue": "#00d2ff",
        "text-gray": "#a0a0b0",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
