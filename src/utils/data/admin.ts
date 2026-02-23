export const adminLevels = ["super-admin", "admin", "support"] as const;
export type AdminLevel = (typeof adminLevels)[number];
export const adminLevelNos = adminLevels.map((_, i) => i as 0 | 1 | 2);

export const compareAdminLevels = (level1: AdminLevel, level2: AdminLevel) => {
  const level1No = adminLevelNos[adminLevels.indexOf(level1)];
  const level2No = adminLevelNos[adminLevels.indexOf(level2)];
  return level1No > level2No
    ? "greater"
    : level1No < level2No
      ? "lesser"
      : "equal";
};

export const getAdminLowerLevels = (level: AdminLevel) => {
  const ind = adminLevels.indexOf(level);
  return adminLevels.slice(ind, adminLevels.length);
};
