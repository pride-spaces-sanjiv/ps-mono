import { ResponseHandler } from "@/middlewares/request.js";
import { Admin } from "@pride-spaces/backend/database/models/user.js";
import {
  compareCryptos,
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

type LoginOptions<T extends any> = {
  projectors: keyof ModelToRaw<Model<T>>[];
  keyName: string;
  level: RequiredSessionData["user"]["userType"];
};
export const login =
  <T extends any>(model: Model<T>, options: Partial<LoginOptions<T>> = {}) =>
  async (
    req: ManagedRequest<{ email: string; password: string; [k: string]: any }>,
    res: ManagedResponse,
  ) => {
    console.log("Inside login middleware");
    const { projectors = [], keyName = "data", level } = options;
    try {
      const { email, password } = req.body;
      const encodedPass = encodeCrypto(password);
      const doc = await model.findOne(
        { email: email },
        { _id: 1, email: 1, name: 1, password: 1, username: 1, level: 1 },
      );

      if (!doc) {
        return ResponseHandler.handleNotFound(res, {
          errorType: `${keyName}-not-found`,
          message: `No such ${keyName} exists`,
        });
      }

      // @ts-ignore
      if (!compareCryptos(encodedPass, doc.password)) {
        return ResponseHandler.handleUnauthorized(res, {
          errorType: `${keyName}-invalid-credentials`,
          message: "Password is incorrect",
        });
      }

      // Sign Bearer Token
      const token = signJWTwithCrypto(
        // @ts-ignore
        { id: doc.id, level: level || doc.level },
        { expiresIn: "7d" },
      );
      const refreshToken = signJWTwithCrypto(
        // @ts-ignore
        { id: doc.id, level: level || doc.level, refresh: true },
        { expiresIn: "30d" },
      );

      // Updating session data of user
      req.session.user = {
        id: doc.id,
        // @ts-ignore
        name: doc.name,
        // @ts-ignore
        email: doc.email,
        // @ts-ignore
        userType: level || doc.level,
      };
      req.session.resetMaxAge();
      req.session.save();

      // Send, bearer, refresh token and other details
      ResponseHandler.handleSuccess(res, {
        message: "Login successful",
        data: {
          token: token,
          refreshToken: refreshToken,
          id: doc?.id,
          expiry: new Date(decodeJWTwithCrypto(token)?.expiry as number),
        },
      });
    } catch (err) {
      ResponseHandler.handleError(res, {
        errorType: "login-error",
        message: `Failed to login as ${keyName}`,
      });
    }
  };
