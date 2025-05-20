/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Main dark color
        primary: {
          DEFAULT: '#2B2D42', // Main color
          50: '#EAEAEE',     // Lightest shade
          100: '#D5D6DD',    // Very light shade
          200: '#ACADBD',    // Light shade
          300: '#8284A0',    // Medium-light shade
          400: '#595C7C',    // Medium shade
          500: '#2B2D42',    // Base color - same as DEFAULT
          600: '#25273B',    // Slightly darker
          700: '#1F2033',    // Darker
          800: '#18192C',    // Very dark
          900: '#121224',    // Darkest shade
        },
        // Remove secondary color and rely on gray instead
        // Grayscale palette (keeping neutral naming for compatibility)
        neutral: {
          50: '#fafafa',     // Lightest gray
          100: '#f5f5f5',    // Very light gray
          200: '#e5e5e5',    // Light gray
          300: '#d4d4d4',    // Medium-light gray
          400: '#a3a3a3',    // Medium gray
          500: '#737373',    // Medium-dark gray
          600: '#525252',    // Dark gray
          700: '#404040',    // Very dark gray
          800: '#262626',    // Extra dark gray
          900: '#171717',    // Almost black
        },
        // Add explicit white color
        white: '#ffffff',
      },
    },
  },
  plugins: [],
}
