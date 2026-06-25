export const spaceCategories = [
  "Standard",
  "Classic",
  "Elite",
  "Apex",
] as const;

export type SpaceCategory = (typeof spaceCategories)[number];
