import { adminLevels } from "./admin.js";

export const userTypes = [
  ...adminLevels,
  "operator",
  "builder",
  "user",
] as const;
export type UserType = (typeof userTypes)[number];

export const nonAdminUserTypes = userTypes.filter(
  (usr) => !adminLevels.includes(usr as (typeof adminLevels)[number]),
) as Exclude<UserType, (typeof adminLevels)[number]>[];
export type NonAdminUserType = (typeof nonAdminUserTypes)[number];
