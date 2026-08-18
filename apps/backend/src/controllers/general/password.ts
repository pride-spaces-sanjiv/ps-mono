import { ResponseHandler } from "@/middlewares/request.js";
import { Admin } from "@pride-spaces/backend/database/models/user.js";
import {
  compareCryptos,
  decodeCrypto,
  encodeCrypto,
} from "@pride-spaces/common/utils/crypto.js";
import {
  decodeJWTwithCrypto,
  signJWTwithCrypto,
} from "@pride-spaces/common/utils/jwt.js";
import { type AdminSchema } from "@pride-spaces/backend/database/schemas/user.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import { Model } from "mongoose";
import { ModelToRaw } from "@pride-spaces/backend/types/mongoose/document.js";
import { RequiredSessionData } from "express-session";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";

type GetOptions<T extends any> = {
  projectors: keyof ModelToRaw<Model<T>>[];
  keyName: string;
  level: RequiredSessionData["user"]["userType"];
};
export const getPassword =
  <T extends any>(model: Model<T>, options: Partial<GetOptions<T>> = {}) =>
  async (req: ManagedRequest<{ [k: string]: any }>, res: ManagedResponse) => {
    const { projectors = [], keyName = "data", level } = options;
    try {
      const { id = "" } = req.params;
      const doc = await model.findOne({ _id: id }, { _id: 1, password: 1 });

      if (!doc) {
        return ResponseHandler.handleNotFound(res, {
          errorType: `${keyName}-not-found`,
          message: `No such ${keyName} exists`,
        });
      }

      // Send, bearer, refresh token and other details
      ResponseHandler.handleSuccess(res, {
        message: "Password received successfully",
        data: {
          // @ts-ignore
          password: doc.password,
          // @ts-ignore
          decodedPassword: decodeCrypto(doc.password),
        },
      });
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: "password-fetch-error-failure",
        message: `Failed to fetch password for ${keyName}`,
      });
    }
  };

type ChangeOptions<T extends any> = {
  projectors: keyof ModelToRaw<Model<T>>[];
  keyName: string;
  level: RequiredSessionData["user"]["userType"];
};
export const changePassword =
  <T extends any>(model: Model<T>, options: Partial<ChangeOptions<T>> = {}) =>
  async (
    req: ManagedRequest<{ password: string; [k: string]: any }>,
    res: ManagedResponse,
  ) => {
    const { projectors = [], keyName = "data", level } = options;
    try {
      const { id = "" } = req.params;
      const { password: newPassword } = req.body;
      const encodedPass = encodeCrypto(newPassword);
      const doc = await model.findOne(
        { _id: id },
        { _id: 1, password: 1, username: 1, level: 1 },
      );

      if (!doc) {
        return ResponseHandler.handleNotFound(res, {
          errorType: `${keyName}-not-found`,
          message: `No such ${keyName} exists`,
        });
      }

      // @ts-ignore
      if (compareCryptos(encodedPass, doc.password)) {
        return ResponseHandler.handleError(res, {
          errorType: `${keyName}-same-password`,
          message: "New password cannot be the same as the current password",
        });
      }

      // Update new password
      const updatedDoc = await model.findOneAndUpdate(
        { _id: id },
        { password: encodedPass },
        { new: true, projection: { password: 1, _id: 1, name: 1, email: 1 } },
      );
      if (!updatedDoc) {
        return ResponseHandler.handleNotFound(res, {
          errorType: `${keyName}-not-found`,
          message: `No such ${keyName} exists`,
        });
      }

      // Send, bearer, refresh token and other details
      ResponseHandler.handleSuccess(res, {
        message: "Password changed successfully",
        data: convertDataToJSON(updatedDoc),
      });
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: "password-change-error-failure",
        message: `Failed to change password for ${keyName}`,
      });
    }
  };
