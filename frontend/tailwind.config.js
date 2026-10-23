/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5bafd",
          400: "#8194fa",
          500: "#6370f5",
          600: "#4f51e8",
          700: "#4240cf",
          800: "#3636a7",
          900: "#303484",
          950: "#1d1e4e",
        },
        surface: {
          50:  "#f8f9fc",
          100: "#f0f2f8",
          200: "#e4e8f2",
          300: "#cdd4e6",
          400: "#a8b4cf",
          500: "#8795b8",
          600: "#6977a0",
          700: "#556088",
          800: "#47506f",
          900: "#3d455d",
          950: "#111827",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
