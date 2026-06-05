import { RedisStore } from "connect-redis";
import Redis, { RedisClientOptions, RedisClientType } from "redis";
import { sleep } from "../../time.js";

const redisStr = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
const redisClients: { [x: string]: RedisClientType } = {};

export const RedisClientDBs = { general: 1, sessionStore: 0, dbPiped: 2 };

export const getRedisClient = async (db: number | string) => {
  try {
    const client = redisClients[String(db)];
    if (!client.isOpen) {
      await client.connect();
    }
    return client || null;
  } catch (err) {
    return null;
  }
};

export const createRedisClient = (options: RedisClientOptions = {}) => {
  const { database = 0 } = options;
  const client = Redis.createClient({
    url: redisStr,
    // username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS,
    ...options,
    database: database,
  });
  // @ts-ignore
  redisClients[database] = client;
  getRedisClient(database);

  client.on("connect", () => {
    console.log("Redis connected");
  });
  client.on("disconnect", async () => {
    console.log("Redis disconnected");
    for (let i = 0; i < 20; i++) {
      console.log("Redis connection retry", i + 1);
      const client = await getRedisClient?.(database);
      if (client?.isOpen) {
        return;
      }
      await sleep(1);
    }
  });
  client.on("error", (...args) => {
    console.error("Error connecting redis :", ...args);
  });

  return client;
};

export const RedisClient = createRedisClient({
  database: RedisClientDBs.general,
});

const redisStoreClient = createRedisClient({
  database: RedisClientDBs.sessionStore,
});
export const redisStore = new RedisStore({ client: redisStoreClient });

export const RedisClients = {
  GENERAL: RedisClient,
  SESSION: redisStoreClient,
  DBPIPED: createRedisClient({
    database: RedisClientDBs.dbPiped,
  }),
};
