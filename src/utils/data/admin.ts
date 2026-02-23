export const adminLevels = ["super-admin", "admin", "support"] as const;
export type AdminLevel = (typeof adminLevels)[number];
