import { Model } from "mongoose";
import { ManagedRequest } from "@/types/request.js";
import { ModelDocumentKeys } from "@/types/mongoose/document.js";

export type SortOrder = "asc" | "desc";
export type SortOptions<
  F extends string = string,
  SB extends string = "sortBy",
  SO extends string = "sortOrder",
> = {
  allowOnly: F[];
  defaultSortField: F;
  defaultSortOrder: SortOrder;
  fields: Partial<{
    sortBy: SB;
    sortOrder: SO;
  }>;
};

export const getFieldsandProjectors = <M extends Model<any>, F extends string>(
  req: ManagedRequest<
    any,
    {
      field?: ModelDocumentKeys<M>[] | ModelDocumentKeys<M>;
      sortBy?: ModelDocumentKeys<M>;
      sortOrder?: SortOrder;
      [k: string]: any;
    }
  >,
  model: M,
  allFields: F[],
  ignoreFields?: F[],
) => {
  let fields =
    (Array.isArray(req.query.field) ? req.query.field : [req.query.field])
      // @ts-ignore
      .filter((f: F) => typeof f === "string")
      // @ts-ignore
      .map((f: F) => f.trim() as F)
      .map((f) => (f === "id" ? "_id" : f))
      .filter((f) => allFields.includes(f as F)) || allFields;
  fields = !fields.length ? allFields : fields;

  ignoreFields = Array.isArray(ignoreFields) ? ignoreFields : [];
  const projectors = {
    createdAt: 1,
    updatedAt: 1,
    ...Object.fromEntries(
      fields
        .filter((field) => !(ignoreFields as F[]).includes(field as F))
        .map((field) => [field, 1]),
    ),
  } as Partial<Record<Exclude<F, "id"> | "createdAt" | "updatedAt" | "_id", 1>>;

  const data = {
    fields: fields,
    projectors: projectors,
  };

  return data;
};

export const cleanProjectors = <
  O extends { [k: string]: any },
  T extends 1 | 0 | true | false = 0,
>(
  projector: O,
  // @ts-ignore
  exclude: T = 0,
) => {
  const cleaned = { ...projector };
  for (const key in cleaned) {
    // @ts-ignore
    if (cleaned[key] === exclude) {
      delete cleaned[key];
    }
  }
  return cleaned;
};

/**
 * @description Returns `sort-options` based on query params
 * @description Checks for
 * @description Returns `null` if fails
 */
export const getSortOptions = <
  F extends string = string,
  SB extends string = "sortBy",
  SO extends string = "sortOrder",
>(
  req: ManagedRequest<
    any,
    {
      [k: string]: any;
    }
  >,
  options?: Partial<SortOptions<F, SB, SO>>,
) => {
  try {
    options = {
      allowOnly: [],
      ...options,
      // @ts-ignore
      fields: { sortBy: "sortBy", sortOrder: "sortOrder", ...options?.fields },
    };
    const field =
      (options?.fields?.sortBy &&
        options?.allowOnly?.find(
          (f) => f == req.query[String(options?.fields?.sortBy)],
        )) ||
      (options?.defaultSortField &&
        options?.allowOnly?.find((f) => f == options?.defaultSortField));
    const order =
      req.query[String(options?.fields?.sortOrder)] === "asc"
        ? "asc"
        : options?.defaultSortOrder || "desc";

    if (typeof field !== "string") {
      throw new Error("Sort field is not valid type, required string");
    }
    if (field) {
      const data = {
        sortBy: field,
        sortOrder: order as SortOrder,
      };
      return data;
    }
    throw new Error("No match for sort field");
  } catch (err) {
    return null;
  }
};
