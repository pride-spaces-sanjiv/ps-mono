export const spaceTypes = ["Flex", "MOS", "Both"] as const;
export const labelledSpaceTypes = spaceTypes.map((v, i) => ({
  label:
    v +
    " ( " +
    (v === "Flex"
      ? "Co-Working"
      : v === "MOS"
        ? "Managed"
        : "Co-Working and Managed") +
    " )",
  value: v,
}));
export const spaceGrades = ["A+", "A", "B"] as const;
