// Media Type

export const mediaTypes = {
  IMAGE: "image",
  LAYOUT: "layout",
} as const;
export type MediaType = (typeof mediaTypes)[keyof typeof mediaTypes];

// Media Status
export const mediaStatuses = {
  UPLOAD: "uploaded",
  REMOVE: "removed",
} as const;
export type MediaStatus = (typeof mediaStatuses)[keyof typeof mediaStatuses];
