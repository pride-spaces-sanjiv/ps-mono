import { RedisStore } from "connect-redis";
import Redis from "redis";
import { sleep } from "../../time.js";

const redisStr = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
export const RedisClient = Redis.createClient({
  url: redisStr,
  // username: process.env.REDIS_USER,
  password: process.env.REDIS_PASS,
  // @ts-ignore
  database: 2,
});

export const getRedisClient = async () => {
  try {
    if (!RedisClient.isOpen) {
      await RedisClient.connect();
    }
    return RedisClient || null;
  } catch (err) {
    return null;
  }
};
getRedisClient();

RedisClient.on("connect", () => {
  console.log("Redis connected");
});
RedisClient.on("disconnect", async () => {
  console.log("Redis disconnected");
  for (let i = 0; i < 20; i++) {
    console.log("Redis connection retry", i + 1);
    const client = await getRedisClient?.();
    if (client?.isOpen) {
      return;
    }
    await sleep(1);
  }
});
RedisClient.on("error", (...args) => {
  console.error("Error connecting redis :", ...args);
});

export const redisStore = new RedisStore({ client: RedisClient });
