import type { Datified } from "@/utils/object/datify";
import type { OperatorSchema } from "@/utils/schemas/operators";
import type { GeneralData } from "./general";

export type Operator = GeneralData &
  Omit<Partial<OperatorSchema & { totalSpaces: number }>, "password">;

export type DatifiedOperator = Datified<Operator, ["createdAt", "updatedAt"]>;
