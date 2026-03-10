import { ResponseHandler } from "./request.js";
import { NextFunction } from "express";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";
import moment from "moment";

type Options<T extends Record<string, any>, K extends keyof T> = {
  fields: [...K[]];
};
/**
 * @description Converts `ISO-DATE` string value in JSON body field to `Date` object
 * @description Accepts `string` and `number` field values
 */
export const preParseDateFieldsFromBody =
  <T extends Record<string, any>, K extends keyof T = keyof T>(
    options: Partial<Options<T, K>> = {},
  ) =>
  async (req: ManagedRequest, res: ManagedResponse, next: NextFunction) => {
    try {
      const { fields = [] } = options;
      if (typeof req.body === "object" && req.body) {
        for (const field of fields) {
          if (
            (typeof req.body[field] === "string" ||
              typeof req.body[field] === "number") &&
            moment(req.body[field]).isValid()
          ) {
            const date = new Date(req.body[field]);
            req.body[field] = date;
          }
        }
      }
      next?.();
    } catch (err) {
      return ResponseHandler.handleError(res, {
        errorType: "date--field-parser-failure",
        message: "Parsed error occurred",
      });
    }
  };
