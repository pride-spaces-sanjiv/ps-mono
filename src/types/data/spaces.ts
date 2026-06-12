import type { Datified } from "@/utils/object/datify";
import type { SpaceSchema } from "@/utils/schemas/spaces";
import type { GeneralData } from "./general";
import type { DeepInfer } from "./infer";

export type Space = DeepInfer<
  GeneralData & Omit<Partial<SpaceSchema>, "password">
>;

export type DatifiedSpace = DeepInfer<
  Datified<Space, ["createdAt", "updatedAt", "openTime", "closeTime"]>
>;
