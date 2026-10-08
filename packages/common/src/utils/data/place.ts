export const placeTypes = [
  "restaurant",
  "hotel",
  "bus:station",
  "metro:station",
  "railway:station",
  "airport",
  "banks",
  "unknown",
] as const;
export type PlaceType = (typeof placeTypes)[number];
