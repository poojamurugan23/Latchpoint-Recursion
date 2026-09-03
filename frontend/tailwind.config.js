/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        "bg-subtle": "#FAFAFA",
        surface: "#FFFFFF",
        border: "#EBEBEE",
        "border-strong": "#DCDCE2",

        "ink-900": "#14141B",
        "ink-600": "#63636D",
        "ink-400": "#9C9CA4",

        accent: "#23265C",
        "accent-hover": "#191B45",
        "accent-tint": "#EEEEF5",

        allow: "#227A4E",
        "allow-bg": "#EAF6EE",
        verify: "#A8720F",
        "verify-bg": "#FBF1DF",
        hold: "#B0591F",
        "hold-bg": "#FBEEE1",
        block: "#A93434",
        "block-bg": "#FAEAEA",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["40px", { lineHeight: "48px", fontWeight: "600" }],
        title: ["28px", { lineHeight: "36px", fontWeight: "600" }],
        verdict: ["22px", { lineHeight: "30px", fontWeight: "500" }],
        body: ["16px", { lineHeight: "24px" }],
        secondary: ["14px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "16px" }],
        button: ["14px", { lineHeight: "1", fontWeight: "600", letterSpacing: "0.01em" }],
        eyebrow: ["11px", { lineHeight: "1", fontWeight: "600", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "8px",
        md: "12px",
        lg: "20px",
        button: "10px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(20,20,27,0.04)",
        md: "0 8px 24px rgba(20,20,27,0.08)",
      },
      transitionDuration: {
        DEFAULT: "120ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
      spacing: {
        18: "72px",
        22: "88px",
        30: "120px",
      },
    },
  },
  plugins: [],
}
