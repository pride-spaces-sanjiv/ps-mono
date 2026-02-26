import {
  FlattenMaps,
  Model,
  MongooseError,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
} from "mongoose";
import { MongoError } from "mongodb";
import {
  getFieldsandProjectors,
  getSortOptions,
  SortOptions,
} from "./filters.js";
import { convertDataToJSON } from "./conversion.js";
import { validateNumber } from "@/utils/number.js";
import { ManagedRequest } from "@/types/request.js";
import { ModelToRaw } from "@/types/mongoose/document.js";

export const paginatedResults = async <
  M extends Model<any>,
  T extends ModelToRaw<M>,
  F extends string = string,
>(
  req: ManagedRequest<
    any,
    { page?: number; limit?: number; order?: "desc" | "asc"; [k: string]: any }
  >,
  model: M,
  acceptedFields?: F[],
  params?: Partial<{ limit: number }>,
  args?: Partial<{
    filter: RootFilterQuery<T>;
    projection: ProjectionType<T>;
    options: QueryOptions<T>;
  }>,
  sorterOptions?: Partial<SortOptions<F>>,
) => {
  const data = {
    page: 0,
    results: [] as FlattenMaps<T>[],
    errored: false,
    metrics: {
      total: 0,
      count: 0,
      next: 0,
    },
    err: null as null | Error | MongooseError | MongoError,
  };
  try {
    data.page = Math.max(
      validateNumber(req.query.page, { convertToInt: true, invalidValue: 1 }),
      1,
    );
    const allParams = { limit: 10, ...params };
    const limit = validateNumber(req.query.limit ?? allParams.limit, {
      convertToInt: true,
      invalidValue: 10,
    });
    const offset = (data.page - 1) * limit;
    const { projectors } = getFieldsandProjectors(
      req,
      model,
      acceptedFields || [],
    );
    const { sortBy = "", sortOrder = "" } =
      getSortOptions(req, sorterOptions) || {};

    const total = await model.countDocuments(args?.filter);
    const next = await model.countDocuments(args?.filter, {
      skip: offset + limit,
      limit: limit,
    });

    const results = (await model
      // @ts-ignore
      .find(args?.filter, { ...projectors, ...args?.projection }, args?.options)
      .skip(offset)
      .sort(sortBy ? { [sortBy]: sortOrder || "desc" } : {})
      .limit(limit)) as FlattenMaps<T>[];
    data.results = results;
    data.metrics.total = total;
    data.metrics.next = next;
    data.metrics.count = results.length;
  } catch (err: any) {
    data.errored = true;
    data.err = err;
  } finally {
    return data;
  }
};

export const cleanPaginatedData = <T extends any>(
  // @ts-ignore
  data: Awaited<ReturnType<typeof paginatedResults<Model<any>, T>>>,
) => {
  const cleaned: Omit<typeof data, "err" | "errored" | "results"> & {
    results: Exclude<ReturnType<typeof convertDataToJSON<T>>, null>[];
  } = {
    ...data,
    results: data.results
      .map((doc) => convertDataToJSON(doc))
      .filter((d) => !!d),
  };
  // @ts-ignore
  delete cleaned.err;
  // @ts-ignore
  delete cleaned.errored;
  return cleaned;
};
