import { adminLevels } from "./admin.js";

export const userTypes = [...adminLevels, "enterprise", "user"] as const;
export type UserType = (typeof userTypes)[number];
