export const spaceTypes = ["Flex", "MOS", "Both"] as const;
export const spaceGrades = ["A+", "A", "B"] as const;

export type SpaceType = (typeof spaceTypes)[number];
export type SpaceGrade = (typeof spaceGrades)[number];
