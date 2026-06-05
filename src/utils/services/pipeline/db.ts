import { RedisClients } from "@/utils/services/redis/redis.js";
import {
  Model,
  QueryOptions,
  RootFilterQuery,
  Types,
  UpdateQuery,
} from "mongoose";
import { Admin, User } from "@/database/models/user.js";
import { ProjectionType } from "mongoose";
import { Abortable } from "mongodb";
import { SetOptions } from "redis";
import { Operator } from "@/database/models/operator.js";
import { Space } from "@/database/models/space.js";
import { Dump } from "@/database/models/dump.js";
import { Amenity } from "@/database/models/amenities.js";
import { City, State } from "@/database/models/state-cities.js";

type PipelineDBOptions<N extends string, T extends Record<string, any>> = {
  name: N;
  model: Model<T>;
};

class PipelineDB<N extends string, T extends Record<string, any>> {
  redisKeyPrefix: undefined | string;
  name: N | undefined;
  model: Model<T> | undefined;
  isValid = false;

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
  } {
    if (!this.isValid) {
      throw new Error("PipelineDB is in invalid state");
    }
  }

  getData = async (
    dbOptions: Partial<{
      filter: RootFilterQuery<T> | undefined;
      projection: ProjectionType<T> | null | undefined;
      options:
        | (QueryOptions<T> & {
            lean?: boolean;
          } & Abortable)
        | undefined;
    }> = {},
    redisOptions: Partial<SetOptions> = {},
  ) => {
    this.validate();

    const { filter = {}, projection, options = {} } = dbOptions;
    const { expiration = { type: "EX", value: 10 } } = redisOptions;
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
    if (doc) {
      const cacheStr = JSON.stringify(
        doc.toJSON({ flattenMaps: true, flattenObjectIds: true }),
      );
      RedisClients.DBPIPED.set(
        redisKey.replaceAll("{{id}}", doc.id || "-"),
        cacheStr,
        { ...redisOptions, expiration },
      );
    }
    return doc;
  };

  updateData = async (
    dbOptions: Partial<{
      filter: RootFilterQuery<T> | undefined;
      updateData: UpdateQuery<T> | undefined;
      options:
        | (QueryOptions<T> & {
            includeResultMetadata?: boolean;
            lean?: boolean;
          })
        | undefined;
    }> = {},
    redisOptions: Partial<SetOptions> = {},
  ) => {
    this.validate();

    const { filter = {}, updateData, options = {} } = dbOptions;
    const { expiration = { type: "EX", value: 10 } } = redisOptions;
    const strs = {
      filter: JSON.stringify(filter || {}),
      options: JSON.stringify(options || {}),
      projection: JSON.stringify(options.projection || {}),
    };
    const redisBaseKey = `${this.redisKeyPrefix}:{{id}}`;
    const redisKey = `${redisBaseKey}:single:filt:${strs.filter}:proj:${strs.projection}:opts:${strs.options}`;

    // Update doc from DB
    const doc = await this.model?.findOneAndUpdate(filter, updateData);
    // Cache data
    if (doc) {
      const cacheStr = JSON.stringify(
        doc.toJSON({ flattenMaps: true, flattenObjectIds: true }),
      );
      // Invalidate all similar caches
      if (doc.id) {
        RedisClients.DBPIPED.del(
          `${redisBaseKey}:*`.replace("{{id}}", doc.id),
        ).then((res) => {
          RedisClients.DBPIPED.set(
            redisKey.replaceAll("{{id}}", doc.id || "-"),
            cacheStr,
            { ...redisOptions, expiration },
          );
        });
      }
    }
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
