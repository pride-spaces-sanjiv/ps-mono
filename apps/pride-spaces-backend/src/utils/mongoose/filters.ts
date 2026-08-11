import { FilterQuery, Model, ProjectionType, RootFilterQuery } from "mongoose";
import { Aggregator, aggregate } from "mingo";
import { $project, $sample } from "mingo/operators/pipeline";
import { allGeneralFieldsEnabled } from "./fields.js";
import {
  ModelDocumentKeys,
  ModelToDocument,
  ModelToRaw,
} from "@/types/mongoose/document.js";
import { ObjectDepthKeys } from "@/types/object.js";
import { ManagedRequest } from "@/types/request.js";
import { $jsonSchema } from "mingo/operators/query";
import { cleanObject } from "../object/clean.js";

export type SortOrder = "asc" | "desc";
export type SortOptions<
  F extends string = string,
  SB extends string = "sortBy",
  SO extends string = "sortOrder",
> = {
  allowOnly: F[];
  defaultSortField: F;
  defaultSortOrder: SortOrder;
  allowTimestampFields: boolean;
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
    (Array.isArray(req.parsedQuery.field)
      ? req.parsedQuery.field
      : [req.parsedQuery.field]
    )
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

export const projectiseDataToDoc = async <T extends any>(
  model: Model<T>,
  data: Partial<T>,
  options: Partial<{ projection: ProjectionType<T> | null }> = {},
) => {
  let { projection = null } = options;

  if (
    projection &&
    ((typeof projection === "object" && Object.keys(projection).length > 0) ||
      (typeof projection === "string" && projection.trim()))
  ) {
    if (typeof projection === "string") {
      projection = Object.fromEntries(
        projection
          .split(/ +/g)
          .map((f) => [
            f.trim().replace(/^-/, ""),
            (f.trim().startsWith("-") ? 0 : 1) as 0 | 1,
          ]),
      ) as Exclude<ProjectionType<T>, string>;
    }

    // Check projection validity
    const values = Object.values(projection);
    const projectionType =
      values[0] === 1 || values[0] === true
        ? "inclusion"
        : values[0] === 0 || values[0] === false
          ? "exclusion"
          : "invalid";
    if (
      projectionType === "invalid" ||
      values.find((v) => (projectionType === "inclusion" ? !v : !!v))
    ) {
      throw new Error("Either of exclusion or inclusion allowed");
    }

    const docRaw = data;
    const [projectedData] = new Aggregator([
      {
        $project: projection || {},
        $jsonSchema,
      },
    ]).run([docRaw]);
    const projectedDoc = model.hydrate(projectedData);
    return projectedDoc;
  }
};

const timestampFields = Object.keys(allGeneralFieldsEnabled).filter(
  (k) => k !== "_id",
) as (keyof Omit<typeof allGeneralFieldsEnabled, "_id">)[];
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
    const { allowTimestampFields = true } = options as typeof options & {};
    const field =
      (allowTimestampFields &&
        (timestampFields.find(
          (f) => f == req.parsedQuery[String(options?.fields?.sortBy)],
        ) ||
          timestampFields.find((f) => f == options?.defaultSortField))) ||
      (options?.fields?.sortBy &&
        options?.allowOnly?.find(
          (f) => f == req.parsedQuery[String(options?.fields?.sortBy)],
        )) ||
      (options?.defaultSortField &&
        options?.allowOnly?.find((f) => f == options?.defaultSortField));
    const order =
      req.parsedQuery[String(options?.fields?.sortOrder)] === "asc"
        ? "asc"
        : options?.defaultSortOrder || "desc";
    console.log("Finalised sorting field :", {
      sortBy: field,
      sortOrder: order as SortOrder,
    });

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
    // console.error("Get sort options err :", err);
    return null;
  }
};

export const getSearchFilters = <M extends Model<any>>(
  req: ManagedRequest<
    any,
    {
      [k: string]: any;
    }
  >,
  options: Partial<{
    fieldMaps: Record<string, ObjectDepthKeys<ModelToRaw<M>>>;
  }> = {},
) => {
  try {
    const { fieldMaps = {} } = options;
    const filter = {} as Partial<
      Record<keyof ModelToRaw<M>, { $regex: string; $options: string }>
    >;
    for (const queryField in fieldMaps) {
      if (
        !Object.hasOwn(req.parsedQuery, `s${queryField}`) ||
        !req.parsedQuery[`s${queryField}`]
      ) {
        continue;
      }
      const field = fieldMaps[queryField];
      filter[field] = {
        $regex: String(req.parsedQuery[`s${queryField}`])
          .trim()
          .toLowerCase()
          .replace(/ +/g, " "),
        $options: "i",
      };
    }
    return filter;
  } catch (err) {
    return null;
  }
};

export const getMultiFilters = <M extends Model<any>>(
  req: ManagedRequest<
    any,
    {
      [k: string]: any;
    }
  >,
  options: Partial<{
    fieldMaps: Record<string, ObjectDepthKeys<ModelToRaw<M>>>;
  }> = {},
) => {
  try {
    const { fieldMaps = {} } = options;
    const filter = {} as Partial<Record<keyof ModelToRaw<M>, { $in: any[] }>>;
    for (const queryField in fieldMaps) {
      if (
        !Object.hasOwn(req.parsedQuery, `f${queryField}`) ||
        !req.parsedQuery[`f${queryField}`]
      ) {
        continue;
      }
      const field = fieldMaps[queryField];
      filter[field] = {
        $in: req.parsedQuery[`f${queryField}`],
      };
    }
    return filter;
  } catch (err) {
    return null;
  }
};

export const getRangedFilters = <M extends Model<any>>(
  req: ManagedRequest<
    any,
    {
      [k: string]: any;
    }
  >,
  options: Partial<{
    rangedFieldMaps: Record<
      string,
      {
        fields:
          | ObjectDepthKeys<ModelToRaw<M>>
          | [ObjectDepthKeys<ModelToRaw<M>>, ObjectDepthKeys<ModelToRaw<M>>];
        ranges: { id: number; min?: number; max?: number }[];
      }
    >;
  }> = {},
) => {
  try {
    const { rangedFieldMaps = {} } = options;
    const filter = {} as Partial<
      Record<string, { $or: Required<FilterQuery<ModelToRaw<M>>>["$or"] }>
    >;
    for (const queryField in rangedFieldMaps) {
      if (!Object.hasOwn(req.parsedQuery, `r${queryField}`)) {
        continue;
      }
      const rangeIds = rangedFieldMaps[queryField].ranges.map((r) => r.id);
      const acceptedRanges = [
        ...new Set(req.parsedQuery[`r${queryField}`] as any[]),
      ]?.filter((rg: number) => rangeIds.includes(Number(rg)));
      const fields = rangedFieldMaps[queryField].fields;
      if (acceptedRanges.length) {
        const diff = Array.isArray(fields)
          ? { $subtract: [`$${fields[0]}`, `$${fields[1]}`] }
          : null;
        filter[queryField] = {
          $or: rangedFieldMaps[queryField].ranges
            .filter((r) => acceptedRanges.includes(r.id))
            .map((r) =>
              diff
                ? {
                    $expr: {
                      $and: [
                        r.min !== undefined ? { $gte: [diff, r.min] } : false,
                        r.max !== undefined ? { $lte: [diff, r.max] } : false,
                      ].filter((v): v is boolean => !!v),
                    },
                  }
                : {
                    [fields as string]: cleanObject(
                      { $gte: r.min, $lte: r.max },
                      { excludeByValues: [undefined] },
                    ),
                  },
            ),
        };
      }
    }
    console.log("Range or filters :", Object.values(filter));
    const rangeFilters = { $and: Object.values(filter) };
    console.log("Range filters :", rangeFilters);
    return rangeFilters;
  } catch (err) {
    return null;
  }
};
