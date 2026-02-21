// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      gridTemplateColumns: {
        "auto-form": "repeat(auto-fill, minmax(300px, 1fr))",
      },
      gap: {
        1.5: "6px",
        4.5: "18px",
      },
    },
  },
};
