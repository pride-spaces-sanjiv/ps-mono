export const spaceCategories = ["Starter", "Classic", "Elite", "Apex"] as const;

export type SpaceCategory = (typeof spaceCategories)[number];
