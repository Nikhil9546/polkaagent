/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        polka: {
          pink: "#E6007A",
          purple: "#6D3AEE",
          dark: "#0a0a12",
          card: "#12121e",
          border: "#1e1e30",
          text: "#8b8a9e",
          light: "#F5F3FF",
        },
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "'Inter'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        gradient: "gradient 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
