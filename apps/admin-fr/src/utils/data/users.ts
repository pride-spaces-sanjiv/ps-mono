export const userLevels = [
  "Customer",
  "Reseller",
  "Admin",
  "Super Admin",
] as const;
export const userLevelsData = userLevels.map((s, i) => ({
  label: s,
  value: i,
}));
