import express, { RequestHandler } from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import { queryParser } from "express-query-parser";
import moment from "moment";
import fs from "fs";
import util from "node:util";
// Middlewares
import { RequestMiddleware, ResponseHandler } from "@/middlewares/request.js";
import { validateUserAccess } from "@/middlewares/users.js";
import {
  userAgentLogger,
  validateConnection,
} from "@/middlewares/connections.js";
// Controllers
// Routers
import { AdminRouter } from "@/routes/admin/route.js";
// import { PlaylistRouter } from "@/routes/playlist.js";
// import { JioRouter } from "./routes/jio.js";
// import { ZeeRouter } from "@/routes/zee.js";
// import { SonyRouter } from "@/routes/sony.js";
// import { HotstarRouter } from "@/routes/hotstar.js";
// import { authRouter } from "./routes/auth/route.js";
// import { usersRouter } from "./routes/users/route.js";
// import { accountRouter } from "./routes/account/route.js";
// import { groupRouter } from "./routes/group/route.js";
// import { commonRouter } from "./routes/common/route.js";
// Database
// Services
import { RedisClient, redisStore } from "./utils/services/redis/redis.js";
// Utils
// import { getIP } from "@/utils/ip.js";
// Data
// Types
import {
  ManagedResponseWithLocalUrl,
  ManagedResponseWithLocalUrlIP,
} from "@/types/request.js";
// import { handleMailQueue } from "./utils/services/rabbitmq/email.js";

const app = express();
// let startDate = moment();

// Setup Middlewares
app.set("trust proxy", true);
app.set("view engine", "ejs");

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (
        origin.includes("chrome-extension://opmeopcambhfimffbomjgemehjkbbmji")
      ) {
        return callback(null, true);
      }
      if (origin?.startsWith("https://panel-play.tg-iptv.site")) {
        return callback(null, true);
      }
      if (origin?.startsWith("https://beizer.vercel.app")) {
        return callback(null, true);
      }
      if (origin?.startsWith("https://beiz-panel.tg-iptv.site")) {
        return callback(null, true);
      }
      if (origin?.match(/^http(s|)[:]\/\/localhost[:][345]00[0-9]{0,3}/)) {
        return callback(null, true);
      }
      return callback(
        new Error(`Origin [${origin}] not allowed by CORS`, {
          cause: "cors-origin",
        }),
      );
    },
    credentials: true,
  }),
);

// Session
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET as string,
    cookie: {
      maxAge: moment.duration(7, "days").asMilliseconds(),
    },
    // store: redisStore,
    // rolling: true,
  }),
);

// Parser middlewares
app.use(cookieParser());
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(express.json());
app.use((req, res, next) => {
  console.log("Query", req.query);
  if (!req.query || !Object.keys(req.query).length) {
    return next?.();
  }
  return (
    queryParser({
      parseNull: true,
      parseUndefined: true,
      parseBoolean: true,
      parseNumber: true,
    }) as RequestHandler<
      any,
      any,
      any,
      Partial<{
        [k: string]: string | number | boolean | object | undefined | null;
      }>
    >
  )(req, res, next);
});

// Custom headers]
app.use((req, res, next) => {
  try {
    const headers: Record<string, string> = {
      Server: "Pride Spaces",
      "X-Powered-By": "Pride Spaces",
    };
    for (const key in headers) {
      res.setHeader(key, headers[key]);
    }
    next?.();
  } catch (err) {
    ResponseHandler.handleError(res, {
      message: "Parser error occurred",
      errorType: "parser-error",
    });
  }
});

// Logging api hits
const lines = [...Array(100)].map((_) => "-").join("");
app.use((req, res, next) => {
  try {
    if (fs.existsSync("./logs")) {
      const now = moment().format("DD MMM YYYY hh:mm:ss A");

      const str = util.format(
        "URL :",
        req.originalUrl,
        "\n",
        "Method :",
        req.method,
        "\n",
        "IP :",
        getIP(req),
        "\n",
        "Headers: ",
        req.headers,
        "\n",
        "Query: ",
        req.query,
        "\n",
        "Body: ",
        req.body,
        "\n",
      );
      const log = `[${now}]\n${str}\n\n${lines}\n\n`;

      fs.appendFileSync("./logs/api.log", log);
    }
    next?.();
  } catch (err) {
    ResponseHandler.handleError(res, {
      message: "Operation error",
      errorType: "operation-error",
    });
  }
});

app.get("/", async (req, res) => {
  try {
    const startDate = app.locals?.startDate as undefined | moment.Moment;
    const duration = moment.duration(
      moment().diff(startDate, "seconds"),
      "seconds",
    );
    res.status(200).send({
      id: process.pid,
      startedOn: startDate?.format("DD MMM YYYY [at] hh:mm:ss A"),
      uptime: `${duration.days().toString()}D, ${duration
        .hours()
        .toString()
        .padStart(2, "0")}hrs, ${duration
        .minutes()
        .toString()
        .padStart(2, "0")}mins, ${duration
        .seconds()
        .toString()
        .padStart(2, "0")}secs`,
    });
  } catch (err) {
    ResponseHandler.handleError(res);
  }
});

// Routes may use caching
app.use((req, res: ManagedResponseWithLocalUrl, next) => {
  try {
    if (req.method !== "GET") {
      return next?.();
    }
    res.locals = { ...res.locals, url: req.originalUrl };
    console.log("Local updater");
    next?.();
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "operation-error",
      message: "Operation error",
    });
  }
}, RequestMiddleware.sendCachedData);

app.use("/admin", AdminRouter);
app.use("/enterprise", AdminRouter);

// IP based caching
app.use((req, res: ManagedResponseWithLocalUrlIP, next) => {
  try {
    if (req.method !== "GET") {
      return next?.();
    }

    const IP = getIP(req);
    res.locals = { ...res.locals, cacheIP: IP };
    // console.log("Local updater");
    next?.();
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "operation-error",
      message: "Operation error",
    });
  }
});

// app.use(
//   "/jio",
//   validateUserAccess(
//     { checkActive: true, checkExpiry: true },
//     { filter: { level: { $gte: 0 } } },
//   ),
//   validateConnection(),
//   JioRouter,
// );
// app.use(
//   "/zee",
//   validateUserAccess(
//     { checkActive: true, checkExpiry: true },
//     { filter: { level: { $gte: 0 } } },
//   ),
//   validateConnection(),
//   ZeeRouter,
// );
// app.use(
//   "/sony",
//   validateUserAccess(
//     { checkActive: true, checkExpiry: true },
//     { filter: { level: { $gte: 0 } } },
//   ),
//   validateConnection(),
//   SonyRouter,
// );
// app.use(
//   "/star",
//   validateUserAccess(
//     { checkActive: true, checkExpiry: true },
//     { filter: { level: { $gte: 0 } } },
//   ),
//   validateConnection(),
//   HotstarRouter,
// );

// Independent cache routes
app.use((req, res: ManagedResponseWithLocalUrl, next) => {
  try {
    // @ts-ignore
    res.locals = req.session.user?.id
      ? { ...res.locals, cacheUser: req.session?.user?.id }
      : {};
    next?.();
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "operation-error",
      message: "Operation error",
    });
  }
});
// app.use("/users", RequestMiddleware.authenticateUser(1), usersRouter);
// app.use("/group", RequestMiddleware.authenticateUser(1), groupRouter);
// app.use("/account", RequestMiddleware.authenticateUser(0), accountRouter);

// initiateIO(Number(process.env.SOCKET_PORT));

process.on("beforeExit", async () => {
  try {
    await RedisClient.destroy();
    console.log("Redis connection closed");
  } catch (err) {
    console.error("Error before exiting :", err);
  } finally {
    console.log("Exiting........");
  }
});

export default app;
