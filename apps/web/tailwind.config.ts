import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        card: '#ffffff',
        primary: '#2563eb',
        muted: '#64748b',
      }
    },
  },
  plugins: [],
};
export default config;
