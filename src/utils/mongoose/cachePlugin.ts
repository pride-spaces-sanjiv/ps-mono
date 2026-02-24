import { RedisClient } from "@/utils/services/redis/redis.js";
import { Document, IfAny, Model, Require_id } from "mongoose";
import {
  getRedisObject,
  setRedisObject,
} from "@/utils/services/redis/convert.js";
import { datifyFieldsInObject } from "../object/datify.js";

const defaultDateFields = ["createdAt", "updatedAt"];

type CacheHandlerOptions = {
  query: Record<string, any>;
  dateFields: string[];
  ttl: number;
};
async function cacheHandler<T extends any>(
  model: Model<T>,
  key: string,
  { query = {}, dateFields = [], ttl = 20 }: Partial<CacheHandlerOptions> = {},
) {
  const cached = await getRedisObject(key);

  if (cached) {
    return datifyFieldsInObject(
      cached as Record<string, any>,
      defaultDateFields.concat(defaultDateFields.concat(dateFields)),
    );
  }

  const result = await model.find(query).lean();
  await setRedisObject(key, result, { expiration: { type: "EX", value: ttl } });
  return result;
}

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

async function clearCache(modelName: string) {
  const keys = await RedisClient.keys(`${modelName}:*`);
  if (keys.length) {
    await RedisClient.del(keys);
  }
}

export function cachePlugin<T extends any>(
  this: any,
  model: Model<T>,
  {
    ttl = 20,
    dateFields = [],
  }: Partial<{
    ttl: number;
    dateFields: (keyof T)[];
  }> = {},
) {
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
  model.schema.post("save", clearCache(modelName));
  model.schema.post("findOneAndReplace", clearCache(modelName));
  model.schema.post("updateOne", clearCache(modelName));
  model.schema.post("updateMany", clearCache(modelName));
  model.schema.post("findOneAndUpdate", clearCache(modelName));
  model.schema.post("deleteOne", clearCache(modelName));
  model.schema.post("deleteMany", clearCache(modelName));
  model.schema.post("findOneAndDelete", clearCache(modelName));
}
