import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "./request.js";

export const parseFiltersQuery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query;
    for (const key in query) {
      if (!Object.hasOwn(query, key)) {
        continue;
      }
      if (key.match(/^[fr][A-Z].+/)) {
        if (!Array.isArray(query[key]) && query[key] !== undefined) {
          query[key] = [query[key]];
        }
      }
    }
    console.log("Parsed query filters :", req.query);
    next?.();
  } catch (err) {
    console.error("Filters Query parser error :", err);
    ResponseHandler.handleError(res, {
      errorType: "query-parser-failure",
      message: "Query parsing error",
    });
  }
};
