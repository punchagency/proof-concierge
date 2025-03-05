import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      keyframes: {
        "pulse-ring-1": {
          "0%": { transform: "scale(1)", opacity: "0.2" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "pulse-ring-2": {
          "0%": { transform: "scale(1)", opacity: "0.15" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "pulse-ring-3": {
          "0%": { transform: "scale(1)", opacity: "0.1" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "pulse-audio-slow": {
          "0%, 100%": { height: "8px" },
          "50%": { height: "16px" },
        },
        "pulse-audio-medium": {
          "0%, 100%": { height: "10px" },
          "50%": { height: "24px" },
        },
        "pulse-audio-fast": {
          "0%, 100%": { height: "12px" },
          "50%": { height: "32px" },
        },
      },
      animation: {
        "pulse-ring-1": "pulse-ring-1 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-ring-2": "pulse-ring-2 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s",
        "pulse-ring-3": "pulse-ring-3 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s",
        "pulse-slow": "pulse-audio-slow 1.5s ease-in-out infinite",
        "pulse-medium": "pulse-audio-medium 1.2s ease-in-out infinite",
        "pulse-fast": "pulse-audio-fast 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config; 