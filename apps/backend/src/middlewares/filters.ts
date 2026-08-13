import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "./request.js";

export const parseFiltersQuery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.parsedQuery;
    if (typeof query === "object" && query !== null) {
      for (const key in query) {
        if (!Object.prototype.hasOwnProperty.call(query, key)) {
          continue;
        }
        if (key.match(/^[fr][A-Z].+/)) {
          if (!Array.isArray(query[key]) && query[key] !== undefined) {
            query[key] = [query[key]];
          }
        }
      }
    }
    req.parsedQuery = { ...query };
    console.log("Parsed query filters :", req.parsedQuery);
    next?.();
  } catch (err) {
    console.error("Filters Query parser error :", err);
    ResponseHandler.handleError(res, {
      errorType: "query-parser-failure",
      message: "Query parsing error",
    });
  }
};

type QueryParserOptions = {
  parseNull?: boolean;
  parseUndefined?: boolean;
  parseBoolean?: boolean;
  parseNumber?: boolean;
  parseArray?: boolean;
};

const parse = (value: unknown, options: QueryParserOptions): unknown => {
  if (typeof value === "string") {
    if (value === "") return "";

    if (options.parseNull && value === "null") return null;
    if (options.parseUndefined && value === "undefined") return undefined;

    if (options.parseBoolean && (value === "true" || value === "false")) {
      return value === "true";
    }

    if (
      options.parseNumber &&
      value.trim() !== "" &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }

    return value;
  }

  if (options.parseArray && Array.isArray(value)) {
    return value.map((v) => parse(v, options));
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      (value as any)[key] = parse((value as any)[key], options);
    }
  }

  return value;
};

export const queryParser =
  (options: QueryParserOptions = {}) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = parse(
      structuredClone(req.query),
      options,
    ) as typeof req.query;
    req.parsedQuery = { ...parsed };
    next();
  };
