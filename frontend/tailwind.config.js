/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(9, 9, 11)',
        foreground: 'rgb(250, 250, 250)',
        border: 'rgba(255, 255, 255, 0.08)',
        input: 'rgba(255, 255, 255, 0.05)',
        ring: 'rgb(168, 85, 247)',
        primary: {
          DEFAULT: 'rgb(168, 85, 247)',
          foreground: 'rgb(250, 250, 250)',
        },
        card: {
          DEFAULT: 'rgb(17, 17, 19)',
          foreground: 'rgb(240, 240, 240)',
          border: 'rgba(255, 255, 255, 0.06)',
        },
        muted: {
          DEFAULT: 'rgb(39, 39, 42)',
          foreground: 'rgb(161, 161, 170)',
        },
        accent: {
          DEFAULT: 'rgb(39, 39, 42)',
          foreground: 'rgb(244, 244, 245)',
        },
        destructive: {
          DEFAULT: 'rgb(239, 68, 68)',
          foreground: 'rgb(250, 250, 250)',
        },
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        'premium': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 8px 30px rgba(0, 0, 0, 0.5)',
        'premium-glow': '0 0 20px rgba(168, 85, 247, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
