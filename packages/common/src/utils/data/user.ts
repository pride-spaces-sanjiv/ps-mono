import { UserType } from "./userTypes.js";

export const ADMIN_PERMISSIONS = [
  "settings",
  "dashboard",
  "operators",
  "conventional",
  "amenities",
  "team",
  "users",
  "notifications",
  "migrations",
  "crm",
] as const;

export type Permission = (typeof ADMIN_PERMISSIONS)[number];

export type SidebarPermissionsMap = Record<
  UserType,
  readonly Permission[] | readonly string[]
>;

export const defaultSidebarPermissions: Partial<SidebarPermissionsMap> = {
  "super-admin": ADMIN_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  support: ADMIN_PERMISSIONS,
  operator: ["settings", "dashboard", "operators", "notifications"],
  builder: [],
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserType;
  avatarUrl?: string;
}
