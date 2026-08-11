import type { Datified } from "@/utils/object/datify";
import type { OperatorSchema } from "@/utils/schemas/operators";
import type { GeneralData } from "./general";
import type { DeepInfer } from "./infer";

export type Operator = DeepInfer<
  GeneralData &
    Omit<Partial<OperatorSchema & { totalSpaces: number }>, "password">
>;

export type DatifiedOperator = DeepInfer<
  Datified<Operator, ["createdAt", "updatedAt"]>
>;
