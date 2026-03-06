import type { Datified } from "@/utils/object/datify";
import type { UserSchema, AdminSchema } from "@/utils/schemas/user";
import type { GeneralData } from "./general";

export type User = GeneralData & Omit<Partial<UserSchema>, "password">;
export type Admin = GeneralData & Omit<Partial<AdminSchema>, "password">;

export type DatifiedUser = Datified<User, ["createdAt", "updatedAt"]>;
export type DatifiedAdmin = Datified<Admin, ["createdAt", "updatedAt"]>;
