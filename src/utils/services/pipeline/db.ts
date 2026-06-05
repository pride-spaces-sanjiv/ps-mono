import { Admin, User } from "@/database/models/user.js";
import { Operator } from "@/database/models/operator.js";
import { Space } from "@/database/models/space.js";
import { Dump } from "@/database/models/dump.js";
import { Amenity } from "@/database/models/amenities.js";
import { City, State } from "@/database/models/state-cities.js";
import { RedisClients } from "@/utils/services/redis/redis.js";
// types
import { SetOptions } from "redis";
import { Abortable } from "mongodb";
import {
  AnyObject,
  ProjectionType,
  HydratedDocument,
  Model,
  QueryOptions,
  RootFilterQuery,
  Types,
  UpdateQuery,
  SortOrder,
} from "mongoose";

const invalidateSimilarCaches = async (
  redisBaseKey: string,
  docId?: string,
) => {
  try {
    if (docId) {
      const key = `${redisBaseKey}:${docId}:*`;
      const res = await RedisClients.DBPIPED.del(key);
      return res;
    }
  } catch (err) {}
};

type PipelineDBOptions<N extends string, T extends Record<string, any>> = {
  name: N;
  model: Model<T>;
};

class PipelineDB<N extends string, T extends Record<string, any>> {
  protected redisKeyPrefix: undefined | string;
  protected name: N | undefined;
  protected model: Model<T> | undefined;
  private isValid = false;

  constructor({ name, model }: PipelineDBOptions<N, T>) {
    try {
      if (!name?.trim() || !model) {
        throw new Error(
          "Invalid pipeline options, name and model are required",
        );
      }
      this.name = name;
      this.model = model;
      this.redisKeyPrefix = `db:${name}`;
      this.isValid = true;
    } catch (err) {
      console.error("Error initializing pipeline DB:", err);
    }
  }

  validate(): asserts this is this & {
    name: N;
    model: Model<T>;
    redisKeyPrefix: string;
  } {
    if (!this.isValid) {
      throw new Error("PipelineDB is in invalid state");
    }
  }

  getProtectedProps = () => {
    const props = {
      redisKeyPrefix: this.redisKeyPrefix,
      name: this.name,
      model: this.model,
      isValid: this.isValid,
    };
    return props;
  };

  // Cache handlers

  cacheDoc = async (
    redisKey: string,
    doc: HydratedDocument<T> | null,
    redisOptions: Partial<SetOptions> = {},
  ) => {
    if (doc) {
      const { expiration = { type: "EX", value: 10 } } = redisOptions;
      const cacheStr = JSON.stringify(
        doc.toJSON({ flattenMaps: true, flattenObjectIds: true }),
      );
      const result = await RedisClients.DBPIPED.set(
        redisKey.replaceAll("{{id}}", doc.id || "-"),
        cacheStr,
        { ...redisOptions, expiration },
      );
      return result;
    }
    return null;
  };

  cacheDocs = async (
    redisKey: string,
    docs: HydratedDocument<T>[] | null,
    redisOptions: Partial<SetOptions> = {},
  ) => {
    if (docs) {
      const { expiration = { type: "EX", value: 10 } } = redisOptions;
      const convertedDocs = docs.map((doc) =>
        doc.toJSON({ flattenMaps: true, flattenObjectIds: true }),
      );
      const cacheStr = JSON.stringify(convertedDocs);
      const result = await RedisClients.DBPIPED.set(redisKey, cacheStr, {
        ...redisOptions,
        expiration,
      });
      return result;
    }
    return null;
  };

  // Getters

  getMultiData = async (
    dbOptions: Partial<{
      filter: RootFilterQuery<T> | undefined;
      projection: ProjectionType<T> | null | undefined;
      options: (QueryOptions<T> & Abortable) | undefined;
      offset: number;
      limit: number;
      sortOptions: {
        arg?:
          | string
          | { [key: string]: SortOrder | { $meta: any } }
          | [string, SortOrder][]
          | undefined
          | null;
        options?: { override?: boolean };
      };
    }> = {},
    redisOptions: Partial<SetOptions> = {},
  ) => {
    this.validate();

    const {
      filter = {},
      projection = null,
      options = {},
      limit = 10,
      offset = 0,
      sortOptions = {},
    } = dbOptions;
    const strs = {
      filter: JSON.stringify(filter || {}),
      projection: JSON.stringify(projection || {}),
      options: JSON.stringify(options || {}),
      sortArgs: JSON.stringify(
        typeof sortOptions?.arg === "object" && sortOptions?.arg
          ? sortOptions?.arg
          : null,
      ),
      sortOptions: JSON.stringify(
        typeof sortOptions?.options === "object" && sortOptions?.options
          ? sortOptions?.options
          : null,
      ),
    };
    const redisKey = `${this.redisKeyPrefix}:multi:filt:${strs.filter}:proj:${strs.projection}:opts:${strs.options}:limit:${limit}:page:${offset}:sortArgs:${typeof sortOptions?.arg === "object" ? strs.sortArgs : (sortOptions?.arg ?? null)}:sortOpts:${typeof sortOptions?.options === "object" ? strs.sortOptions : (sortOptions?.options ?? null)}`;

    // Process if cache exists
    try {
      const cacheStr = await RedisClients.DBPIPED.get(redisKey);
      if (cacheStr?.trim()) {
        const parsed = JSON.parse(cacheStr) as T[];
        const docs = parsed.map((data) => {
          const doc = new this.model(data);
          if (data._id) {
            doc._id = Types.ObjectId.createFromHexString(data._id);
          }
          return doc;
        });
        return docs;
      }
    } catch (err) {}

    // Get docs from DB
    await User.find();
    const docs = await this.model
      ?.find(filter, projection, options)
      .skip(offset)
      .sort(sortOptions?.arg, sortOptions?.options)
      .limit(limit);
    // Cache data
    this.cacheDocs(redisKey, docs, redisOptions);
    return docs;
  };

  getData = async (
    dbOptions: Partial<{
      filter: RootFilterQuery<T> | undefined;
      projection: ProjectionType<T> | null | undefined;
      options: (QueryOptions<T> & Abortable) | undefined;
    }> = {},
    redisOptions: Partial<SetOptions> = {},
  ) => {
    this.validate();

    const { filter = {}, projection = null, options = {} } = dbOptions;
    const strs = {
      filter: JSON.stringify(filter || {}),
      projection: JSON.stringify(projection || {}),
      options: JSON.stringify(options || {}),
    };
    const redisKey = `${this.redisKeyPrefix}:{{id}}:single:filt:${strs.filter}:proj:${strs.projection}:opts:${strs.options}`;

    // Process if cache exists
    try {
      const cacheStr = await RedisClients.DBPIPED.get(redisKey);
      if (cacheStr?.trim()) {
        const parsed = JSON.parse(cacheStr) as T;
        const doc = new this.model(parsed);
        if (parsed._id) {
          doc._id = Types.ObjectId.createFromHexString(parsed._id);
        }
        return doc;
      }
    } catch (err) {}

    // Get doc from DB
    const doc = await this.model?.findOne(filter, projection, options);
    // Cache data
    this.cacheDoc(redisKey, doc, redisOptions);
    return doc;
  };

  // Updaters
  createData = async (
    dbOptions: Partial<{
      data: Partial<T> | undefined;
      fields?: any | null;
      options?: boolean | AnyObject;
    }> = {},
    redisOptions: Partial<SetOptions> = {},
  ) => {
    this.validate();

    const { data, options = {}, fields = undefined } = dbOptions;
    const strs = {
      options: JSON.stringify(options || {}),
    };
    const redisBaseKey = `${this.redisKeyPrefix}:{{id}}`;
    const redisKey = `${redisBaseKey}:single:filt:{}:proj:{}:opts:${strs.options}`;

    // Create doc in DB
    const doc = new this.model(data, fields, options);

    // Invalidate similar caches
    invalidateSimilarCaches(this.redisKeyPrefix, doc?.id).finally(() => {
      // Cache data
      this.cacheDoc(redisKey, doc, redisOptions);
    });

    return doc;
  };

  updateData = async (
    dbOptions: Partial<{
      filter: RootFilterQuery<T> | undefined;
      updateData: UpdateQuery<T> | undefined;
      options: QueryOptions<T> | undefined;
    }> = {},
    redisOptions: Partial<SetOptions> = {},
  ) => {
    this.validate();

    const { filter = {}, updateData, options = { new: true } } = dbOptions;
    const strs = {
      filter: JSON.stringify(filter || {}),
      options: JSON.stringify(options || {}),
      projection: JSON.stringify(options.projection || {}),
    };
    const redisBaseKey = `${this.redisKeyPrefix}:{{id}}`;
    const redisKey = `${redisBaseKey}:single:filt:${strs.filter}:proj:${strs.projection}:opts:${strs.options}`;

    // Update doc to DB
    const doc = await this.model.findOneAndUpdate(filter, updateData, options);

    // Invalidate similar caches
    invalidateSimilarCaches(this.redisKeyPrefix, doc?.id).finally(() => {
      // Cache data
      this.cacheDoc(redisKey, doc, redisOptions);
    });

    return doc;
  };

  deleteData = async (
    dbOptions: Partial<{
      filter: RootFilterQuery<T> | undefined;
      options: QueryOptions<T> | undefined;
    }> = {},
  ) => {
    this.validate();

    const { filter = {}, options = { new: true } } = dbOptions;

    // Delete doc from DB
    const doc = await this.model.findOneAndDelete(filter, options);

    // Invalidate similar caches
    invalidateSimilarCaches(this.redisKeyPrefix, doc?.id);
    return doc;
  };
}

// Db Pipelines
export const pipelineDBs = {
  USER: new PipelineDB({ name: User.collection.name, model: User }),
  ADMIN: new PipelineDB({ name: Admin.collection.name, model: Admin }),
  OPERATOR: new PipelineDB({ name: Operator.collection.name, model: Operator }),
  SPACE: new PipelineDB({ name: Space.collection.name, model: Space }),
  AMENITY: new PipelineDB({ name: Amenity.collection.name, model: Amenity }),
  STATE: new PipelineDB({ name: State.collection.name, model: State }),
  CITY: new PipelineDB({ name: City.collection.name, model: City }),
  DUMP: new PipelineDB({ name: Dump.collection.name, model: Dump }),
};

export const getPipelineDBFromModelName = (name: string) => {
  const inst = Object.values(pipelineDBs).find((inst) => {
    const props = inst.getProtectedProps();
    return props.model?.modelName === name;
  });
  return inst;
};
