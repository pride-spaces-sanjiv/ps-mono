import { ResponseHandler } from "@/middlewares/request.js";
import { getFieldsandProjectors } from "@/utils/mongoose/filters.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { getFieldsOfModel } from "@/utils/mongoose/fields.js";
import { cleanObject } from "@/utils/object/clean.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { ModelToRaw } from "@/types/mongoose/document.js";
import { Model } from "mongoose";
import { RequiredSessionData } from "express-session";

type DataOptions<T extends any> = {
  projectors: keyof ModelToRaw<Model<T>>[];
  keyName: string;
  level: RequiredSessionData["user"]["userType"];
};
export const getData =
  <T extends any>(
    model: Model<T>,
    options: Partial<DataOptions<T> & { nonProjectPassword: boolean }> = {},
  ) =>
  async (
    req: ManagedRequest<any, { [k: string]: any }>,
    res: ManagedResponse,
  ) => {
    const {
      keyName = "",
      projectors = [],
      nonProjectPassword = true,
    } = options;
    try {
      const allowedFields = getFieldsOfModel(model, {
        timestamps: false,
      }) as string[];
      const { fields, projectors } = getFieldsandProjectors(
        req,
        model,
        nonProjectPassword
          ? allowedFields.filter((field) => field !== "password")
          : allowedFields,
      );

      const doc = await model.findOne(
        { _id: req.session.user?.id },
        cleanObject(projectors),
      );
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: `${keyName}-not-found`,
          message: `No such ${keyName} exists`,
        });
        return;
      }

      const data = convertDataToJSON(doc);
      ResponseHandler.handleSuccess(res, {
        message: `Got ${keyName} details`,
        data: data,
      });
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: `get-${keyName}-error-failure`,
        message: `Failed to get ${keyName} details`,
      });
    }
  };

export const updateData =
  <T extends any>(model: Model<T>, options: Partial<DataOptions<T>> = {}) =>
  async (req: ManagedRequest<Record<string, any>>, res: ManagedResponse) => {
    const { keyName = "", projectors = [] } = options;
    try {
      const body = req.body;
      const doc = await model.findOneAndUpdate(
        { _id: req.session.user?.id },
        body,
        {
          new: true,
        },
      );
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: `${keyName}-not-found`,
          message: `No such ${keyName} exists`,
        });
        return;
      }

      const data = convertDataToJSON(doc);
      ResponseHandler.handleSuccess(res, {
        message: `Updated ${keyName} successfully`,
        data: data,
      });
    } catch (err: any) {
      const errorData = handleMongooseError(err, res, {
        uniqueError: {
          errorType: `${keyName}-unique-error`,
          msgPre: `${keyName.charAt(0).toUpperCase() + keyName.slice(1)}`,
        },
      });
      if (errorData.handled) {
        return;
      }
      ResponseHandler.handleError(res, {
        errorType: `update-${keyName}-error-failure`,
        message: `Failed to update ${keyName}`,
      });
    }
  };
