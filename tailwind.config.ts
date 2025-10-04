import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "large-title": [
          "2.125rem",
          { lineHeight: "1.2", letterSpacing: "-0.025em", fontWeight: "700" },
        ],
        "title-1": [
          "1.75rem",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "400" },
        ],
        "title-2": [
          "1.375rem",
          { lineHeight: "1.3", letterSpacing: "-0.015em", fontWeight: "400" },
        ],
        "title-3": [
          "1.25rem",
          { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "400" },
        ],
        headline: [
          "1.0625rem",
          { lineHeight: "1.3", letterSpacing: "-0.005em", fontWeight: "600" },
        ],
        body: ["1.0625rem", { lineHeight: "1.4", fontWeight: "400" }],
        callout: ["1rem", { lineHeight: "1.4", fontWeight: "400" }],
        subhead: ["0.9375rem", { lineHeight: "1.4", fontWeight: "400" }],
        footnote: ["0.8125rem", { lineHeight: "1.4", fontWeight: "400" }],
        "caption-1": ["0.75rem", { lineHeight: "1.3", fontWeight: "400" }],
        "caption-2": ["0.6875rem", { lineHeight: "1.2", fontWeight: "400" }],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "14": "56px",
        "16": "64px",
        "18": "72px",
        "20": "80px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        apple: "12px",
        "apple-sm": "8px",
        "apple-lg": "16px",
      },
      colors: {
        // Apple System Colors
        apple: {
          blue: "rgb(var(--apple-blue))",
          "blue-light": "rgb(135 206 250)", // Light blue for better dark mode contrast
          green: "rgb(var(--apple-green))",
          indigo: "rgb(var(--apple-indigo))",
          orange: "rgb(var(--apple-orange))",
          pink: "rgb(var(--apple-pink))",
          purple: "rgb(var(--apple-purple))",
          red: "rgb(var(--apple-red))",
          teal: "rgb(var(--apple-teal))",
          yellow: "rgb(var(--apple-yellow))",
          gray: "rgb(var(--apple-gray))",
          "gray-2": "rgb(var(--apple-gray-2))",
          "gray-3": "rgb(var(--apple-gray-3))",
          "gray-4": "rgb(var(--apple-gray-4))",
          "gray-5": "rgb(var(--apple-gray-5))",
          "gray-6": "rgb(var(--apple-gray-6))",
        },
        // Semantic Colors
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: {
          DEFAULT: "rgb(var(--card))",
          foreground: "rgb(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "rgb(var(--popover))",
          foreground: "rgb(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "rgb(var(--accent))",
          foreground: "rgb(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive))",
          foreground: "rgb(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "rgb(var(--success))",
          foreground: "rgb(var(--primary-foreground))",
        },
        warning: {
          DEFAULT: "rgb(var(--warning))",
          foreground: "rgb(var(--primary-foreground))",
        },
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        chart: {
          "1": "rgb(var(--chart-1))",
          "2": "rgb(var(--chart-2))",
          "3": "rgb(var(--chart-3))",
          "4": "rgb(var(--chart-4))",
          "5": "rgb(var(--chart-5))",
        },
      },
      boxShadow: {
        "apple-sm": "0 1px 3px rgba(0, 0, 0, 0.1)",
        apple: "0 4px 12px rgba(0, 0, 0, 0.15)",
        "apple-lg": "0 8px 25px rgba(0, 0, 0, 0.15)",
      },
      keyframes: {
        "apple-fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(8px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "apple-scale-in": {
          from: {
            opacity: "0",
            transform: "scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "apple-slide-up": {
          from: {
            opacity: "0",
            transform: "translateY(16px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "apple-fade-in":
          "apple-fade-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "apple-scale-in":
          "apple-scale-in 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "apple-slide-up":
          "apple-slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
