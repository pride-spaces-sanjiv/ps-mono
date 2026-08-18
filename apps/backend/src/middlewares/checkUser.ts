import { Model } from "mongoose";
import { NextFunction } from "express";
import { Admin } from "@/database/models/user.js";
import { ResponseHandler } from "./request.js";
import {
  AdminLevel,
  adminLevels,
  compareAdminLevels,
} from "@/utils/data/admin.js";
import {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";

// Check user exists by field value, then pass/exit
export const checkUserExistenceByBodyValue = <T extends any, K extends string>(
  model: Model<T>,
  fields: K | K[],
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
    req: ManagedRequest<Record<string, any> & Partial<Record<K, any>>>,
    res: ManagedResponse,
    next: NextFunction,
  ) => {
    try {
      const existsFieldChecker = async (field: K) => {
        const val = req.body[field];
        const exists = await model.findOne({ [field]: val }, { [field]: 1 });
        if (passOnExists) {
          if (!exists) {
            ResponseHandler.handleNotFound(res, {
              errorType: `${userErrorKey}-not-found`,
              message: `No such ${userErrorMsgKey} exists`,
            });
            return true;
          }
          return false;
        }
        if (exists) {
          ResponseHandler.handleError(res, {
            errorType: `${userErrorKey}-exists`,
            message: `${userErrorMsgKey} already exists`,
          });
          return true;
        }
        return false;
      };

      fields = Array.isArray(fields) ? fields : [fields];
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const exists = await existsFieldChecker(field);
        if (exists) {
          return;
        }
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

// Allowance of admin levels in body
export const allowAdminLevelByBody = <K extends string = "level">({
  field = "level" as K,
  levelErrorKey = "admin-level",
  levelErrorMsgKey = "admin-level",
  allowedCompares = ["lesser"],
}: Partial<{
  field: K;
  levelErrorKey: string;
  levelErrorMsgKey: string;
  allowedCompares: ReturnType<typeof compareAdminLevels>[];
}> = {}) => {
  const handler = async (
    req: ManagedRequest<Record<string, any> & Record<K, any>>,
    res: ManagedResponse,
    next: NextFunction,
  ) => {
    try {
      const selfId = req.session.user?.id;

      const selfDoc = await Admin.findOne({ _id: selfId }, { level: 1 });
      if (req.body[field]) {
        const comparison = compareAdminLevels(
          selfDoc?.level as AdminLevel,
          req.body[field],
        );
        if (!allowedCompares.includes(comparison)) {
          return ResponseHandler.handleUnauthorized(res, {
            errorType: `${levelErrorKey}-unauthorized`,
            message: `You are not authorized to set ${levelErrorMsgKey} to this value`,
          });
        }
      }
      return next();
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: `check-${levelErrorKey}-error`,
        message: `Failed to check ${levelErrorMsgKey}`,
      });
    }
  };
  return handler;
};

// Allowance of admin levels from param id
export const authorizeAdminDetailsByParam = <K extends string = "id">({
  field = "id" as K,
  levelErrorKey = "admin-level",
  levelErrorMsgKey = "admin-level",
  notFoundKey = "admin",
  notFoundMsgKey = "admin",
  allowedCompares = ["lesser"],
}: Partial<{
  field: K;
  levelErrorKey: string;
  levelErrorMsgKey: string;
  notFoundKey: string;
  notFoundMsgKey: string;
  allowedCompares: ReturnType<typeof compareAdminLevels>[];
}> = {}) => {
  const handler = async (
    req: ManagedRequest,
    res: ManagedResponse,
    next: NextFunction,
  ) => {
    try {
      const selfId = req.session.user?.id;

      const selfDoc = await Admin.findOne({ _id: selfId }, { level: 1 });
      const otherDoc = await Admin.findOne(
        { _id: req.params?.[field] },
        { level: 1 },
      );

      if (!otherDoc) {
        return ResponseHandler.handleNotFound(res, {
          errorType: `${notFoundKey}-not-found`,
          message: `No such ${notFoundMsgKey} exists`,
        });
      }
      if (req.params?.[field] || req.body?.[field]) {
        const comparison = compareAdminLevels(
          selfDoc?.level as AdminLevel,
          otherDoc?.level as AdminLevel,
        );
        if (!allowedCompares.includes(comparison)) {
          return ResponseHandler.handleUnauthorized(res, {
            errorType: `${levelErrorKey}-unauthorized`,
            message: `You are not authorized to this ${levelErrorMsgKey}`,
          });
        }
      }
      return next?.();
    } catch (err: any) {
      ResponseHandler.handleError(res, {
        errorType: `check-${levelErrorKey}-error`,
        message: `Failed to check ${levelErrorMsgKey}`,
        data: { message: err?.message, param: req.params },
      });
    }
  };
  return handler;
};

export const allowAdminLevelsToPass = <K extends AdminLevel>({
  // @ts-ignore
  allowedLevels = adminLevels,
  levelErrorKey = "admin-level",
  levelErrorMsgKey = "admin-level",
  notFoundKey = "admin",
  notFoundMsgKey = "admin",
}: Partial<{
  field: K;
  levelErrorKey: string;
  levelErrorMsgKey: string;
  notFoundKey: string;
  notFoundMsgKey: string;
  allowedLevels: [...K[]];
}> = {}) => {
  const handler = async (
    req: ManagedRequest,
    res: ManagedResponse,
    next: NextFunction,
  ) => {
    try {
      const selfLevel = req.session.user?.userType;

      if (!selfLevel?.trim()) {
        return ResponseHandler.handleNotFound(res, {
          errorType: `${levelErrorKey}-empty`,
          message: `${levelErrorMsgKey} is empty`,
        });
      }
      if (!allowedLevels.includes(selfLevel as any)) {
        return ResponseHandler.handleUnauthorized(res, {
          errorType: `${levelErrorKey}-unauthorized`,
          message: `You are not authorized to this ${levelErrorMsgKey}`,
        });
      }
      return next?.();
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: `check-${levelErrorKey}-error`,
        message: `Failed to check ${levelErrorMsgKey}`,
      });
    }
  };
  return handler;
};
