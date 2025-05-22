import { slate, blue, gray, iris, violet } from '@radix-ui/colors';

module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Radix Colors
        ...Object.fromEntries(Object.entries(slate).map(([k, v]) => [`slate-${k}`, v])),
        ...Object.fromEntries(Object.entries(blue).map(([k, v]) => [`blue-${k}`, v])),
        ...Object.fromEntries(Object.entries(gray).map(([k, v]) => [`gray-${k}`, v])),
        ...Object.fromEntries(Object.entries(iris).map(([k, v]) => [`iris-${k}`, v])),
        ...Object.fromEntries(Object.entries(violet).map(([k, v]) => [`violet-${k}`, v])),
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
