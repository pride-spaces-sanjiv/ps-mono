import { MongooseError } from "mongoose";
import { MongoError, MongoServerError } from "mongodb";

type ErrorType = "mongoose" | "mongo" | "unknown";
type ErrorCause = "unique" | "required" | "unknown";

export const handleMongooseError = (
  err: MongooseError | MongoError | MongoServerError | Error,
) => {
  const data = {
    errorType: "unknown" as ErrorType,
    name: "",
    field: "",
    cause: "unknown" as ErrorCause,
    message: "",
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
      err.keyPattern &&
      typeof err.keyPattern === "object" &&
      Object.keys(err.keyPattern)[0];
    return data;
  }
  return data;
};
