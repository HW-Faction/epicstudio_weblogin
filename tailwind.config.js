export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#B4A46C",     // change this later
        secondary: "#B4806C",
        accent: "#10B981",
        dark: "#0F172A",
        light: "#F8FAFC"
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
        heading: ["Ubuntu", "sans-serif"],
        
      }
    },
  },
  plugins: [],
}