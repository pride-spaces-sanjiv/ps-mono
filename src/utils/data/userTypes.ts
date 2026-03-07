import { adminLevels } from "./admin.js";

export const userTypes = [...adminLevels, "operator", "user"] as const;
export type UserType = (typeof userTypes)[number];
