/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import scrollbar from 'tailwind-scrollbar';
import animate from 'tailwindcss-animate';

export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#0f172a', // Slate-900
          foreground: '#f1f5f9', // Slate-100
        },
        secondary: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
        muted: {
          DEFAULT: '#f1f5f9', // Slate-100
          foreground: '#64748b', // Slate-500
        },
        accent: {
          DEFAULT: '#e2e8f0', // Slate-200
          foreground: '#0f172a',
        },
        border: '#e2e8f0', // Slate-200
        input: '#e2e8f0',
        ring: '#3b82f6', // Blue-500
        
        // Semantic Colors
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [
    forms,
    scrollbar,
    animate
  ],
};
