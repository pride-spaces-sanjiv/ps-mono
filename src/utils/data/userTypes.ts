import { adminLevels } from "./admin.js";

export const userTypes = [
  ...adminLevels,
  "operator",
  "builder",
  "user",
] as const;
export type UserType = (typeof userTypes)[number];
