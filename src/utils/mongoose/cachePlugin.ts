import { RedisClient } from "@/utils/services/redis/redis.js";
import {
  CallbackWithoutResultAndOptionalError,
  Model,
  Query,
  Schema,
} from "mongoose";
import {
  getRedisObject,
  setRedisObject,
} from "@/utils/services/redis/convert.js";
import { datifyFieldsInObject } from "../object/datify.js";
import { SchemaToRaw } from "@/types/mongoose/document.js";

const defaultDateFields = ["createdAt", "updatedAt"];

type CacheHandlerOptions = {
  query: Record<string, any>;
  dateFields: string[];
  ttl: number;
};

type PluginHandler<S extends Schema> = (schema: S, opts?: any) => void;

/**
 * @description GET/SET cache of mongo data
 */
async function cacheHandler<T extends any>(
  model: Model<T>,
  key: string,
  { query = {}, dateFields = [], ttl = 20 }: Partial<CacheHandlerOptions> = {},
) {
  const cached = await getRedisObject(key);

  // return if cache data present
  if (cached) {
    return datifyFieldsInObject(
      cached as Record<string, any>,
      defaultDateFields.concat(dateFields),
    );
  }

  const result = await model.find(query).lean();
  await setRedisObject(key, result, { expiration: { type: "EX", value: ttl } });
  return result;
}

/**
 * @description sets `this._cacheKey` on pre handler
 * @description caches data to key=`this._cacheKey` on post handler
 */
function handlePrePost<T extends any>(
  model: Model<T>,
  method: string | RegExp,
  key: string,
  {
    dateFields = [],
    ttl = 20,
  }: Partial<Omit<CacheHandlerOptions, "query">> = {},
) {
  // @ts-ignore
  model.schema.pre(method, async function () {
    // @ts-ignore
    this._cacheKey = key;
  });

  // @ts-ignore
  model.schema.post(method, async function (result) {
    // @ts-ignore
    const key = this._cacheKey;
    if (key && result) {
      await setRedisObject(
        key,
        datifyFieldsInObject(
          result as Record<string, any>,
          defaultDateFields.concat(dateFields),
        ),
        {
          expiration: { type: "EX", value: ttl },
        },
      );
    }
  });
}

/**
 * @description deletes all cached keys for a given model name in pattern `db-cache-{modelName}:*`
 */
function clearCache<T extends any>(modelName: string) {
  return async (
    err: NativeError,
    res: any,
    callback: CallbackWithoutResultAndOptionalError,
  ) => {
    const keys = await RedisClient.keys(`db-cache-${modelName}:*`);
    if (keys.length) {
      await RedisClient.del(keys);
    }
  };
}

export function cachePlugin<S extends Schema, T extends SchemaToRaw<S>>(
  this: Query<any, T>,
  schema: S,
  {
    ttl = 20,
    dateFields = [],
  }: Partial<{
    ttl: number;
    dateFields: (keyof T)[];
  }> = {},
) {
  const model = this.model;
  const modelName = model.collection.name;
  const query = this.getQuery();
  const key = `db-cache-${modelName}:${JSON.stringify(query)}`;

  // -------------------------
  // CACHE FOR FIND / FINDONE / FINDBYID
  // -------------------------
  cacheHandler(model, key, { query, dateFields: dateFields as string[], ttl });

  handlePrePost(model, "find", key, {
    ttl,
    dateFields: dateFields as string[],
  });
  handlePrePost(model, "findOne", key, {
    ttl,
    dateFields: dateFields as string[],
  });

  // -------------------------
  // INVALIDATE ON WRITE
  // -------------------------
  type MethodName = Parameters<typeof model.schema.post>[0];
  const cacheClearFunc = clearCache(modelName);
  model.schema.post("save" as MethodName, async (err, res, next) => {});
  model.schema.post("findOneAndReplace" as MethodName, cacheClearFunc);
  model.schema.post("updateOne" as MethodName, cacheClearFunc);
  model.schema.post("updateMany" as MethodName, cacheClearFunc);
  model.schema.post("findOneAndUpdate" as MethodName, cacheClearFunc);
  model.schema.post("deleteOne" as MethodName, cacheClearFunc);
  model.schema.post("deleteMany" as MethodName, cacheClearFunc);
  model.schema.post("findOneAndDelete" as MethodName, cacheClearFunc);
}
