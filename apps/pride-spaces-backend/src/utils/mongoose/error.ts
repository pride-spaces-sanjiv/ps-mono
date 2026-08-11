import { Response } from "express";
import { MongooseError } from "mongoose";
import { MongoError, MongoServerError } from "mongodb";
import { ResponseHandler } from "@/middlewares/request.js";

type ErrorType = "mongoose" | "mongo" | "unknown";
type ErrorCause = "unique" | "required" | "unknown";
type UniqueErrorOptions = {
  errorType?: string;
  msgPre?: string;
  msgPost?: string;
  resOptions?: Parameters<typeof ResponseHandler.handleError>[1];
};

export const handleMongooseError = (
  err: MongooseError | MongoError | MongoServerError | Error,
  res: Response,
  options: Partial<{ uniqueError: UniqueErrorOptions }> = {},
) => {
  const { uniqueError } = options;
  const data = {
    errorType: "unknown" as ErrorType,
    name: "",
    field: "",
    cause: "unknown" as ErrorCause,
    message: "",
    handled: false,
  };
  if (err instanceof MongooseError) {
    data.errorType = "mongoose";
    data.name = err.name;
    data.message = err.message;
    return data;
  }
  if (err instanceof MongoError) {
    data.errorType = "mongo";
    data.name = err.name;
    data.message = err.message;
    return data;
  }
  if (err instanceof MongoServerError) {
    data.errorType = "mongo";
    data.name = err.name;
    data.cause = Number(err.code) === 11000 ? "unique" : "unknown";
    data.message = err.message;
    data.field =
      (err.keyPattern &&
        typeof err.keyPattern === "object" &&
        Object.keys(err.keyPattern)[0]) ||
      "";
    if (res && uniqueError) {
      ResponseHandler.handleError(res, {
        ...uniqueError.resOptions,
        errorType:
          uniqueError.resOptions?.errorType ||
          uniqueError.errorType ||
          "data-unique-error",
        message:
          uniqueError.resOptions?.message ||
          `${uniqueError.msgPre || "Data"} ${data.field ? `with this ${data.field}` : ""} ${uniqueError.msgPost || "already exists"}`,
        data:
          uniqueError.resOptions?.data ||
          (data.field ? { field: data.field } : null),
      });
      data.handled = true;
    }
    return data;
  }
  return data;
};
