import { Schema } from "mongoose";
import { SchemaToRaw } from "@/types/mongoose/document.js";
import { ObjectDepthKeys } from "@/types/object.js";

type IndexOptions<T extends string> = {
  singleFields: [...T[]];
  compoundFields: [...T[][]];
  createCompoundFromSingles: boolean;
};
export const indexFieldsFromSchema = <
  S extends Schema,
  T extends ObjectDepthKeys<SchemaToRaw<S>>,
>(
  schema: S,
  options: Partial<
    IndexOptions<T> & {
      indexOptions: Partial<
        Record<"single" | "compound", Parameters<Schema["index"]>[1]>
      >;
      value:
        | undefined
        | Parameters<Schema["index"]>[0][keyof Parameters<Schema["index"]>[0]];
    }
  > = {},
) => {
  const {
    singleFields = [],
    compoundFields = [],
    createCompoundFromSingles = false,
    indexOptions,
    value = 1,
  } = options;
  for (let i = 0; i < singleFields.length; i++) {
    const field = singleFields[i] as string;
    schema.index({ [field]: value }, indexOptions?.single);
  }
  if (createCompoundFromSingles && singleFields.length > 1) {
    schema.index(
      Object.fromEntries(singleFields.map((f) => [f, value])),
      indexOptions?.compound,
    );
  }
  for (let i = 0; i < compoundFields.length; i++) {
    const fields = compoundFields[i] as string[];
    schema.index(
      Object.fromEntries(fields.map((f) => [f, value])),
      indexOptions?.compound,
    );
  }
};
