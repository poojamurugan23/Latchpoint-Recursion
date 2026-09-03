/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF9",
        surface: "#FFFFFF",
        "surface-alt": "#F4F3F1",
        border: "#E8E6E1",
        "text-primary": "#1C1B1A",
        "text-secondary": "#6B6963",
        "text-tertiary": "#A6A49E",

        accent: "#C96442",
        "accent-hover": "#B5573A",

        allow: "#3A8A4A",
        "allow-bg": "#EDF5EE",
        verify: "#C98A2E",
        "verify-bg": "#FBF3E6",
        hold: "#C9622E",
        "hold-bg": "#FBEFE6",
        block: "#B3402F",
        "block-bg": "#FAECE9",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "40px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.04)",
        md: "0 4px 16px rgba(0,0,0,0.08)",
        lg: "0 12px 40px rgba(0,0,0,0.12)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
    },
  },
  plugins: [],
}
