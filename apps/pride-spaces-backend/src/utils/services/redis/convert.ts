import { RedisArgument, SetOptions } from "redis";
import { RedisClient } from "./redis.js";

export const getRedisObject = async <
  T extends { [k: string]: any } | null | any[]
>(
  key: RedisArgument
) => {
  const str = await RedisClient.get(key);
  if (!str?.trim()) {
    return null;
  }
  const parsed = JSON.parse(str) as T;
  return parsed;
};

export const setRedisObject = async <
  T extends { [k: string]: any } | null | any[]
>(
  key: RedisArgument,
  value: T,
  options?: Partial<SetOptions>
) => {
  const str = JSON.stringify(value);
  const saved = await RedisClient.set(key, str, options);
  return !!saved;
};
