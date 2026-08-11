import type { Datified } from "@/utils/object/datify";
import type { UserSchema, AdminSchema } from "@/utils/schemas/user";
import type { GeneralData } from "./general";
import type { DeepInfer } from "./infer";

export type User = DeepInfer<
  GeneralData & Omit<Partial<UserSchema>, "password">
>;
export type Admin = DeepInfer<
  GeneralData & Omit<Partial<AdminSchema>, "password">
>;

export type DatifiedUser = DeepInfer<
  Datified<User, ["createdAt", "updatedAt"]>
>;
export type DatifiedAdmin = DeepInfer<
  Datified<Admin, ["createdAt", "updatedAt"]>
>;
