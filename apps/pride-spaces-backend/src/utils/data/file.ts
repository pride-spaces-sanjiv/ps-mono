import { MediaType } from "./media.js";

export const getDestinationFolder = (fileType: MediaType) => {
  return `${fileType?.trim() || ""}s/`.replace(/^s\//, "unknown/");
};
