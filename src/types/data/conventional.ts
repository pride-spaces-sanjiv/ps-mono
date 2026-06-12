import type { Datified } from "@/utils/object/datify";
import type { ConventionalPropertySchema } from "@/utils/schemas/conventional";
import type { GeneralData } from "./general";
import type { DeepInfer } from "./infer";

export type ConventionalProperty = DeepInfer<
  GeneralData &
    Omit<
      Partial<ConventionalPropertySchema & { totalSpaces: number }>,
      "password"
    >
>;

export type DatifiedConventionalProperty = DeepInfer<
  Datified<ConventionalProperty, ["createdAt", "updatedAt"]>
>;
