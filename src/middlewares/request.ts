import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";
import moment from "moment";
import { z } from "zod";
import { Admin, User } from "@/database/models/user.js";
import { RedisClient } from "@/utils/services/redis/redis.js";
import { decodeCrypto } from "@/utils/crypto.js";
import { decodeJWTwithCrypto } from "@/utils/jwt.js";
import { AdminLevel, adminLevels } from "@/utils/data/admin.js";
// types
import { SessionData, RequiredSessionData } from "express-session";
import { SetOptions } from "redis";
import { ModelToRaw } from "../types/mongoose/document.js";
import { ResponseLocals } from "../types/query.js";
import {
  ManagedRequest,
  ManagedResponse,
  ManagedResponseWithLocalUrl,
} from "../types/request.js";
import { Model } from "mongoose";

type DynamicObject = { [k: string]: any };
type Data = any;

type AuthCookies = Partial<{ __aT__: string }>;

type ValidatableSchema = z.core.$ZodLooseShape;
type DefaultZodSchema = z.core.$ZodLooseShape;

export const extractOnlySchemaKeys = <T extends ValidatableSchema>(
  data: { [k: string]: any } | null | undefined,
  schema: z.ZodObject<T>,
) => {
  let cleaned = { ...data };
  if (typeof data === "object" && data) {
    const schemaFields = Object.keys(schema.shape);
    cleaned = Object.fromEntries(
      Object.entries(data as object).filter((pair) =>
        schemaFields.includes(pair[0]),
      ),
    ) as typeof data;
    console.log("Schema body fields", cleaned);
  }
  return cleaned;
};

export class RequestMiddleware {
  static decryptUserAuthToken(token = "") {
    try {
      // const jwt = decodeCrypto(token);
      const decoded = decodeJWTwithCrypto<
        Partial<{
          id: string;
          level: RequiredSessionData["user"]["userType"];
        }>
      >(token);
      if (!decoded?.data?.id) {
        throw new Error("invalid data");
      }
      return decoded;
    } catch (err) {
      console.error("Error decrypting user auth token :", err);
      return null;
    }
  }

  static handleAuth = async <T extends Model<any> = typeof User>(
    req: Omit<Request, "cookies"> & { cookies?: AuthCookies },
    // @ts-ignore
    model: T = User,
    userType: RequiredSessionData["user"]["userType"] = "user",
  ) => {
    const authData = {
      user: null as null | SessionData["user"],
      invalid: false,
      userTypeConflict: false,
      empty: false,
      expired: false,
      errored: false,
    };
    try {
      const authToken =
        req.headers.authorization?.replace("Bearer", "").trim() ||
        req.cookies?.__aT__?.trim();
      const decodedToken = this.decryptUserAuthToken(authToken);

      // If there is any valid session data already also can authenticate user
      req.session.reload(() => {});
      // console.log(req.session);
      if (
        !decodedToken?.data?.id &&
        req.session.user?.id &&
        typeof req.session.user?.userType === "string"
      ) {
        authData.user = req.session.user;
        if (
          userType === "admin" &&
          !adminLevels.includes(authData.user?.userType as AdminLevel)
        ) {
          authData.userTypeConflict = true;
        }
        if (userType !== "admin" && authData.user?.userType !== userType) {
          authData.userTypeConflict = true;
        }
        return authData;
      }

      // Failures of token validation
      if (!decodedToken || !decodedToken?.data) {
        authData.invalid = true;
        return authData;
      }
      if (!decodedToken?.data?.id?.trim()) {
        authData.empty = true;
        return authData;
      }
      if (decodedToken.expiry <= Date.now()) {
        authData.expired = true;
        return authData;
      }

      // If token is OK then fetch data from DB
      const data = await model.findOne(
        { _id: decodedToken.data.id.trim() },
        { _id: 1, name: 1, username: 1, email: 1, level: 1 },
      );
      if (!data?.id) {
        throw new Error("Invalid data");
      }
      authData.user = {
        id: data.id,
        name: data.name,
        email: data.email || undefined,
        userType: userType === "admin" ? data.level : userType,
      };
      req.session.user = authData.user;
      req.session.save();
      return authData;
    } catch (err) {
      console.error("Error auth :", err);
      authData.errored = true;
      return authData;
    }
  };

  static authenticateUser = <T extends Model<any> = typeof User>(
    // @ts-ignore
    model: T = User,
    userType: RequiredSessionData["user"]["userType"] = "user",
  ) => {
    const handler = async (req: Request, res: Response, next: NextFunction) => {
      try {
        // if (
        //   typeof minLevel !== "number" ||
        //   !Number.isFinite(minLevel) ||
        //   minLevel < 0 ||
        //   minLevel > 3
        // ) {
        //   throw new Error(
        //     "Invalid minimum level, must be number in range [0, 3]",
        //     { cause: "invalid-min-level" },
        //   );
        // }
        const auth = await this.handleAuth(req, model, userType);
        if (auth.userTypeConflict) {
          ResponseHandler.handleUnauthorized(res, {
            errorType: "unauthorized-role-access",
            message: "You cannot access this route",
          });
          return;
        }
        if (auth.invalid) {
          ResponseHandler.handleError(res, {
            message: "Invalid token",
            errorType: "invalid-token",
          });
          return;
        }
        if (auth.empty) {
          ResponseHandler.handleError(res, {
            message: "Empty token",
            errorType: "empty-token",
          });
          return;
        }
        if (auth.expired) {
          ResponseHandler.handleError(res, {
            message: "Token expired",
            errorType: "expired-token",
          });
          return;
        }
        if (auth.errored) {
          throw new Error("Errored handle");
        }
        console.log("Authenticated User", auth);
        next?.();
      } catch (err) {
        console.error("Request handler [auth] error :", err);
        ResponseHandler.handleError(res, {
          message: "Authentication error",
          errorType: "auth-error",
        });
      }
    };
    return handler;
  };

  static sendCachedData = async (
    req: Request,
    res: ManagedResponseWithLocalUrl,
    next: NextFunction,
  ) => {
    try {
      if (req.method !== "GET") {
        next?.();
        return;
      }
      const url = req.originalUrl.trim().toLowerCase();
      const cache = await RedisClient?.get(
        res.locals?.cacheUser
          ? `query:${res.locals?.cacheUser}:${url}`
          : `query:${url}`,
      );
      if (cache) {
        const data: { response: any; status: number } = JSON.parse(cache);
        res.setHeader("X-Cache-Status", "Cached");
        res.status(data.status).send(data.response);
        return;
      }
      res.locals.url = url;
      next?.();
    } catch (err) {
      console.error("Request handler [sendCache] error :", err);
      ResponseHandler.handleError(res, { message: "Cache error" });
    }
  };

  static paramValidator = <T extends z.ZodString>(
    schema: T,
    field: string,
    options?: Partial<{ validateOnlyPresent: boolean; allowEmpty: boolean }>,
  ): RequestHandler<any, any, any, any> => {
    type Requester = Request<any, any, any, any>;
    try {
      const allOptions: typeof options = {
        validateOnlyPresent: true,
        ...options,
      };
      const handler = async (
        req: Requester,
        res: Response,
        next: NextFunction,
      ) => {
        try {
          const val = req.params[field];

          schema.parse(val);
          next?.();
        } catch (err: any) {
          console.log("Inside param errored :", err);

          if (err instanceof z.ZodError) {
            return ResponseHandler.handleError(res, {
              message: err.message,
              errorType: "param-validation",
              appendData: {
                validationError: true,
                error: err.message,
                field: err.issues[0]?.path?.join(".") || "unknown",
                errors: err.issues.map((e) => {
                  // @ts-ignore
                  delete e.input;
                  return e;
                }),
                fields: err.issues.map((e) => e.path.join(".")),
              },
            });
          }
          return ResponseHandler.handleError(res, {
            errorType: "param-validation-parser",
            message: "Validating Parser error occurred",
            appendData: { error: err.message },
          });
        }
      };
      return handler;
    } catch (err) {
      console.log("Inside param errored :", err);
      const handler = async (req: Requester, res: Response) => {
        ResponseHandler.handleError(res, {
          errorType: "param-validation-parser",
          message: "Validating Parser error occurred",
        });
      };
      return handler;
    }
  };

  static queryValidator = <T extends ValidatableSchema>(
    schema: z.ZodObject<T>,
    options?: Partial<{ validateOnlyPresent: boolean; allowEmpty: boolean }>,
  ): RequestHandler<any, any, any, z.infer<typeof schema>> => {
    type Requester = Request<any, any, any, z.infer<typeof schema>>;
    let field = "";
    try {
      const allOptions: typeof options = {
        validateOnlyPresent: true,
        ...options,
      };
      const handler = async (
        req: Requester,
        res: Response,
        next: NextFunction,
      ) => {
        try {
          const query = req.query;
          console.log("Inside query :", query);

          if (!options?.allowEmpty) {
            if (typeof query !== "object" || Array.isArray(query)) {
              return ResponseHandler.handleError(res, {
                message: "Query is invalid",
                errorType: "query-invalid",
              });
            }
            if (!query || !Object.keys(query).length) {
              return ResponseHandler.handleError(res, {
                message: "Query is empty",
                errorType: "query-invalid",
              });
            }
          }

          if (allOptions.validateOnlyPresent) {
            for (const key in query) {
              if (schema.shape[key]) {
                field = key.trim();
                // @ts-ignore
                schema.shape[key].parse(query[key]);
              }
            }
            return next?.();
          }

          schema.parse(query);
          next?.();
        } catch (err: any) {
          console.log("Inside query errored :", err);

          if (err instanceof z.ZodError) {
            return ResponseHandler.handleError(res, {
              message: err.message,
              errorType: "query-validation",
              appendData: {
                validationError: true,
                error: err.message,
                field: err.issues[0]?.path?.join(".") || field || "unknown",
                errors: err.issues.map((e) => {
                  // @ts-ignore
                  delete e.input;
                  return e;
                }),
                fields: err.issues.map((e) => e.path.join(".")),
              },
            });
          }
          return ResponseHandler.handleError(res, {
            errorType: "query-validation-parser",
            message: "Data validation error occurred",
            appendData: { error: err.message },
          });
        }
      };
      return handler;
    } catch (err) {
      console.log("Inside query errored :", err);
      const handler = async (req: Requester, res: Response) => {
        ResponseHandler.handleError(res, {
          errorType: "query-validation-parser",
          message: "Validating Parser error occurred",
        });
      };
      return handler;
    }
  };

  static bodyValidator = <T extends ValidatableSchema>(
    schema: T,
    options?: Partial<{
      allowEmpty: boolean;
      validateOnlyPresent: boolean;
      overridePostValidation: boolean;
      extractOnlyRequiredFields: boolean;
    }>,
  ): RequestHandler<any, any, z.infer<typeof schema>> => {
    type Requester = Request<any, any, z.infer<typeof schema>>;
    try {
      const handler = async (
        req: Requester,
        res: Response,
        next: NextFunction,
      ) => {
        const body = req.body;
        try {
          if (!options?.allowEmpty) {
            if (typeof body !== "object" || Array.isArray(body)) {
              return ResponseHandler.handleError(res, {
                message: "Body is invalid",
                errorType: "body-invalid",
              });
            }
            if (!body || !Object.keys(body).length) {
              return ResponseHandler.handleError(res, {
                message: "Body is empty",
                errorType: "body-empty",
              });
            }
          }

          if (options?.validateOnlyPresent) {
            for (const key in body) {
              // @ts-ignore
              if (schema.shape[key]) {
                // @ts-ignore
                const validated = schema.shape[key].parse(body[key]);
                if (options?.overridePostValidation) {
                  // @ts-ignore
                  req.body[key] = validated;
                }
              }
            }
            if (options?.extractOnlyRequiredFields) {
              req.body = extractOnlySchemaKeys(
                req.body,
                // @ts-ignore
                schema,
              ) as typeof req.body;
            }
            return next?.();
          }
          // @ts-ignore
          const validated = schema.parse(body);
          if (options?.overridePostValidation) {
            req.body = validated;
          }
          if (options?.extractOnlyRequiredFields) {
            req.body = extractOnlySchemaKeys(
              req.body,
              // @ts-ignore
              schema,
            ) as typeof req.body;
          }
          next?.();
        } catch (err: any) {
          if (err instanceof z.ZodError) {
            return ResponseHandler.handleError(res, {
              message: err.message,
              errorType: "body-validation",
              appendData: {
                validationError: true,
                error: err.message,
                field: err.issues[0]?.path?.join(".") || "unknown",
                errors: err.issues.map((e) => {
                  // @ts-ignore
                  delete e.input;
                  return e;
                }),
                fields: err.issues.map((e) => e.path.join(".")),
              },
            });
          }
          return ResponseHandler.handleError(res, {
            errorType: "body-validation-parser",
            message: "Data validation error occurred",
            appendData: { error: err.message },
          });
        }
      };
      return handler;
    } catch (err) {
      const handler = async (req: Requester, res: Response) => {
        ResponseHandler.handleError(res, {
          errorType: "body-validation-parser",
          message: "Validating Parser error occurred",
        });
      };
      return handler;
    }
  };

  static removeCaching = (
    req: ManagedRequest,
    res: ManagedResponseWithLocalUrl,
    next: NextFunction,
  ) => {
    try {
      if (typeof res.locals === "object" && res.locals?.url) {
        // @ts-ignore
        delete res.locals.url;
      }
      next?.();
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: "system-error-cc",
        message: "Error handling system",
      });
    }
  };

  static updateCacheOptions =
    (options: Partial<SetOptions>) =>
    (
      req: ManagedRequest,
      res: ManagedResponseWithLocalUrl,
      next: NextFunction,
    ) => {
      try {
        if (typeof res.locals === "object") {
          res.locals.cacheOptions = options;
        }
        next?.();
      } catch (err) {
        ResponseHandler.handleError(res, {
          errorType: "system-error-copts",
          message: "Error handling system",
        });
      }
    };
}

export class ResponseHandler {
  static options = {
    handleUnauthorizedOptions: {
      success: false,
      errorType: "not-authorized",
      message: "You are not authorized",
      data: null as Data,
      status: 401,
      appendData: {} as DynamicObject,
    },
    handleErrorOptions: {
      success: false,
      message: "Error occurred",
      errorType: "error",
      data: null as Data,
      status: 400,
      appendData: {} as DynamicObject,
    },
    handleNotFound: {
      success: false,
      errorType: "not-found",
      message: "Not found",
      data: null as Data,
      status: 404,
      appendData: {} as DynamicObject,
    },
    handleSuccess: {
      success: true,
      message: "Response success",
      data: null as Data,
      appendData: {} as DynamicObject,
      status: 200,
    },
  };

  static handleUnauthorized = (
    res: ManagedResponse,
    options?: Partial<typeof this.options.handleUnauthorizedOptions>,
    cacheOptions?: Partial<SetOptions>,
  ) => {
    const allOptions = {
      ...this.options.handleUnauthorizedOptions,
      ...options,
    };
    res.status(allOptions.status).send({
      success: allOptions.success,
      errorType: allOptions.errorType,
      message: allOptions.message,
      data: allOptions.data,
      ...allOptions.appendData,
    });
    this.cacher(
      res as ManagedResponseWithLocalUrl,
      {
        response: {
          success: allOptions.success,
          errorType: allOptions.errorType,
          message: allOptions.message,
          data: allOptions.data,
          ...allOptions.appendData,
        },
        status: allOptions.status,
      },
      cacheOptions,
    );
    return;
  };

  static handleError = (
    res: Response,
    options?: Partial<typeof this.options.handleErrorOptions>,
  ) => {
    const allOptions = {
      ...this.options.handleErrorOptions,
      ...options,
    };
    res.status(allOptions.status).send({
      success: allOptions.success,
      errorType: allOptions.errorType,
      message: allOptions.message,
      data: allOptions.data,
      ...allOptions.appendData,
    });
    return;
  };

  static handleSuccess = (
    res: ManagedResponse,
    options?: Partial<typeof this.options.handleSuccess>,
    cacheOptions?: Partial<SetOptions>,
  ) => {
    const allOptions = {
      ...this.options.handleSuccess,
      ...options,
    };
    res.status(allOptions.status).send({
      success: allOptions.success,
      message: allOptions.message,
      data: allOptions.data,
      ...allOptions.appendData,
    });
    this.cacher(
      res as ManagedResponseWithLocalUrl,
      {
        response: {
          success: allOptions.success,
          message: allOptions.message,
          data: allOptions.data,
          ...allOptions.appendData,
        },
        status: allOptions.status,
      },
      cacheOptions,
    );
    return;
  };

  static handleNotFound = (
    res: ManagedResponse,
    options?: Partial<typeof this.options.handleNotFound>,
    cacheOptions?: Partial<SetOptions>,
  ) => {
    const allOptions = {
      ...this.options.handleNotFound,
      ...options,
    };
    res.status(allOptions.status).send({
      success: allOptions.success,
      errorType: allOptions.errorType,
      message: allOptions.message,
      data: allOptions.data,
      ...allOptions.appendData,
    });
    this.cacher(
      res as ManagedResponseWithLocalUrl,
      {
        response: {
          success: allOptions.success,
          errorType: allOptions.errorType,
          message: allOptions.message,
          data: allOptions.data,
          ...allOptions.appendData,
        },
        status: allOptions.status,
      },
      cacheOptions,
    );
    return;
  };

  static cacher = async (
    res: ManagedResponseWithLocalUrl,
    data?: { response: any; status: number },
    cacheOptions?: Partial<SetOptions>,
  ) => {
    try {
      const url = (
        (typeof res.locals === "object" &&
          res.locals &&
          res.locals?.url?.trim()) ||
        ""
      )
        .trim()
        .toLowerCase();
      if (url) {
        const Redis = RedisClient;
        const str =
          typeof data !== "object" ? String(data) : JSON.stringify(data);
        if (Redis) {
          // @ts-ignore
          await Redis?.set(
            `query:${res.locals?.cacheUser || ""}:${url}`.replace(
              /[:]{2,}$/,
              "",
            ),
            str,
            { EX: 20, ...res.locals?.cacheOptions, ...cacheOptions },
          );
        }
      }
    } catch (err) {
      console.error("Redis caching error :", err);
    }
  };
}
