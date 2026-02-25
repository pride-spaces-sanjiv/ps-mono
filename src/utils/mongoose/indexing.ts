import { Schema } from "mongoose";
import { SchemaToRaw } from "@/types/mongoose/document.js";

type IndexOptions<T extends keyof string> = {
  singleFields: T[];
  compoundFields: T[][];
  createCompoundFromSingles: boolean;
};
export const indexFieldsFromSchema = <
  S extends Schema,
  T extends keyof SchemaToRaw<S>,
>(
  schema: S,
  // @ts-ignore
  options: Partial<IndexOptions<T>> = {},
) => {
  const {
    singleFields = [],
    compoundFields = [],
    createCompoundFromSingles = false,
  } = options;
  for (let i = 0; i < singleFields.length; i++) {
    const field = singleFields[i] as string;
    schema.index({ [field]: 1 });
  }
  if (createCompoundFromSingles && singleFields.length > 1) {
    schema.index(Object.fromEntries(singleFields.map((f) => [f, 1])));
  }
  for (let i = 0; i < compoundFields.length; i++) {
    const fields = compoundFields[i] as string[];
    schema.index(Object.fromEntries(fields.map((f) => [f, 1])));
  }
};
