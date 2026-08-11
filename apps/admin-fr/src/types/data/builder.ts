import type { Datified } from "@/utils/object/datify";
import type { BuilderSchema } from "@/utils/schemas/builder";
import type { GeneralData } from "./general";
import type { DeepInfer } from "./infer";

export type Builder = DeepInfer<
  GeneralData &
    Omit<Partial<BuilderSchema & { totalSpaces: number }>, "password">
>;

export type DatifiedBuilder = DeepInfer<
  Datified<Builder, ["createdAt", "updatedAt"]>
>;
