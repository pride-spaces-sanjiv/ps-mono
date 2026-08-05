// Media Type

export const mediaTypes = {
  IMAGE: "image",
  LAYOUT: "layout",
  MIGRATIONFILE: "migrationfile",
  MIGRATIONPART: "migrationpart",
} as const;
export type MediaType = (typeof mediaTypes)[keyof typeof mediaTypes];

export const allowedExtensions = {
  image: ["jpg", "jpeg", "png", "gif"],
  layout: ["pdf"],
  migrationfile: ["csv"],
  migrationpart: ["json"],
};
export type AllowedExtension =
  (typeof allowedExtensions)[keyof typeof allowedExtensions];

// Media Status
export const mediaStatuses = {
  UPLOAD: "uploaded",
  REMOVE: "removed",
} as const;
export type MediaStatus = (typeof mediaStatuses)[keyof typeof mediaStatuses];
