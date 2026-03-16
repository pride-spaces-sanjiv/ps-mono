import type { Datified } from "@/utils/object/datify";
import type { SpaceSchema } from "@/utils/schemas/spaces";
import type { GeneralData } from "./general";

export type Space = GeneralData & Omit<Partial<SpaceSchema>, "password">;

export type DatifiedSpace = Datified<
  Space,
  ["createdAt", "updatedAt", "openTime", "closeTime"]
>;
