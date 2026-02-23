import { Model } from "mongoose";
import { NextFunction } from "express";
import { ResponseHandler } from "./request.js";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";

export const checkUserExistenceByBodyValue = <T extends any, K extends string>(
  model: Model<T>,
  field: K,
  {
    userErrorKey = "user",
    userErrorMsgKey = "user",
    passOnExists = false,
  }: Partial<{
    userErrorKey: string;
    userErrorMsgKey: string;
    passOnExists: boolean;
  }> = {},
) => {
  const handler = async (
    req: ManagedRequest,
    res: ManagedResponse<Record<string, any> & Record<K, any>>,
    next: NextFunction,
  ) => {
    try {
      const val = req.body[field];
      const exists = await model.findOne({ [field]: val }, { [field]: 1 });
      if (passOnExists) {
        if (!exists) {
          return ResponseHandler.handleNotFound(res, {
            errorType: `${userErrorKey}-not-found`,
            message: `No such ${userErrorMsgKey} exists`,
          });
        }
        return next();
      }
      if (exists) {
        return ResponseHandler.handleError(res, {
          errorType: `${userErrorKey}-exists`,
          message: `${userErrorMsgKey} already exists`,
        });
      }
      return next();
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: `check-${userErrorKey}-error`,
        message: `Failed to check ${userErrorMsgKey}`,
      });
    }
  };
  return handler;
};
