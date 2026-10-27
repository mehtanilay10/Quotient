import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./content/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // All semantic colors reference CSS variables so dark mode works automatically
        canvas: {
          DEFAULT: "var(--color-canvas-default)",
          subtle: "var(--color-canvas-subtle)",
          inset: "var(--color-canvas-inset)",
          overlay: "var(--color-canvas-overlay)",
        },
        fg: {
          DEFAULT: "var(--color-fg-default)",
          muted: "var(--color-fg-muted)",
          subtle: "var(--color-fg-subtle)",
          onEmphasis: "var(--color-fg-on-emphasis)",
        },
        border: {
          DEFAULT: "var(--color-border-default)",
          muted: "var(--color-border-muted)",
          subtle: "var(--color-border-subtle)",
        },
        accent: {
          fg: "var(--color-accent-fg)",
          emphasis: "var(--color-accent-emphasis)",
          muted: "var(--color-accent-muted)",
          subtle: "var(--color-accent-subtle)",
        },
        success: {
          fg: "var(--color-success-fg)",
          emphasis: "var(--color-success-emphasis)",
          muted: "var(--color-success-muted)",
          subtle: "var(--color-success-subtle)",
        },
        attention: {
          fg: "var(--color-attention-fg)",
          emphasis: "var(--color-attention-emphasis)",
          muted: "var(--color-attention-muted)",
          subtle: "var(--color-attention-subtle)",
        },
        danger: {
          fg: "var(--color-danger-fg)",
          emphasis: "var(--color-danger-emphasis)",
          muted: "var(--color-danger-muted)",
          subtle: "var(--color-danger-subtle)",
        },
        severe: {
          fg: "var(--color-severe-fg)",
          emphasis: "var(--color-severe-emphasis)",
          muted: "var(--color-severe-muted)",
          subtle: "var(--color-severe-subtle)",
        },
        done: {
          fg: "var(--color-done-fg)",
          emphasis: "var(--color-done-emphasis)",
          muted: "var(--color-done-muted)",
          subtle: "var(--color-done-subtle)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          "Arial",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          '"SF Mono"',
          "Menlo",
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
          },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
  mode: "jit",
};

export default config;
