// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wax: {
          DEFAULT: "#8B5E3C", // warm brown (primary)
          light: "#A67C54",
          dark: "#6B492E",
        },
        flame: {
          DEFAULT: "#E07A5F", // coral CTA
          dark: "#C46249",
        },
        cream: "#F4D1AE",
        gold: "#F6C85F",
        perfume: "#8E7CC3", // accent purple
        bgsoft: "#FFF9F5",
        textmuted: "#4B4B4B",
      },
      fontFamily: {
        heading: ["'Playfair Display'", "serif"],
        body: ["Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 24px rgba(139,94,60,0.08)",
        lift: "0 10px 30px rgba(0,0,0,0.10)",
      },
      borderRadius: {
        xl2: "18px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
