/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}",],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontSize: {
        '9xl': '9rem',  // Example: You can adjust '9rem' to any value you prefer
      },

      colors: {
        background: '#f9f3ff',
        componentbgbeige: '#f8f6f6',
        pritext: '#3B1E54',
        sectext: '#6b7280',
        light: {
          100: '#D6C6FF',
          200: '#A8B5DB',
          300: '#9CA4AB',
        },
        dark: {
          100: '#221f3d',
          200: '#0f0d23',
        },
        button_color: '#ab8bff',
        placeholder: '#777',

        accent: '#AB8BFF'
      },
      fontFamily: {
        quake: ['EarlyQuake'],
        hugh: ['HughLife'],
        neue: ['BebasNeue']
      }
    },
  },
  plugins: [],
}