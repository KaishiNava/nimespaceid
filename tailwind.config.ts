import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {
    fontFamily: { sans: ["var(--font-jakarta)", "Arial", "sans-serif"], display: ["var(--font-space)", "Arial", "sans-serif"] },
    colors: { ink: "#08090b", panel: "#111317", line: "#25282e", muted: "#9298a3" },
    boxShadow: { soft: "0 18px 60px rgba(0,0,0,.32)" }
  }},
  plugins: []
} satisfies Config;