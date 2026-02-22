export const amenities = [
  {
    id: 1,
    name: "Pool",
  },
  {
    id: 2,
    name: "Cabin",
  },
  {
    id: 3,
    name: "WiFi",
  },
] as const;
export const amenityIds = amenities.map((d) => d.id);
export type Amenity = (typeof amenities)[number];
export type AmenityId = (typeof amenityIds)[number];
