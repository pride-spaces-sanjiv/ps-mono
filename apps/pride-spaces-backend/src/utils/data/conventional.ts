// ownership types
export const ownershipTypes = ["freehold"] as const;
export type OwnershipType = (typeof ownershipTypes)[number];

export const greenCerts = ["LEED", "IGBC"] as const;
export type GreenCert = (typeof greenCerts)[number];

export const occupancyStatuses = ["partial", "full"] as const;
export type OccupancyStatus = (typeof occupancyStatuses)[number];

export const furnishStatuses = ["furnished", "warm-shell"] as const;
export type FurnishStatus = (typeof furnishStatuses)[number];

export const sources = ["direct", "broker"] as const;
export type Source = (typeof sources)[number];

export const dealStatuses = ["hot", "warm"] as const;
export type DealStatus = (typeof dealStatuses)[number];

export const esgScores = ["high", "low"] as const;
export type ESGScore = (typeof esgScores)[number];
