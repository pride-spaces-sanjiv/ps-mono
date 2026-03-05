import { ResponseHandler } from "@/middlewares/request.js";
import { Admin } from "@/database/models/user.js";
import { compareCryptos, encodeCrypto } from "@/utils/crypto.js";
import { decodeJWTwithCrypto, signJWTwithCrypto } from "@/utils/jwt.js";
import { type AdminSchema } from "@/database/schemas/user.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";

export const login = async (
  req: ManagedRequest<Pick<AdminSchema, "email" | "password">>,
  res: ManagedResponse,
) => {
  try {
    const { email, password } = req.body;
    const encodedPass = encodeCrypto(password);
    const doc = await Admin.findOne(
      { email: email },
      { _id: 1, email: 1, name: 1, password: 1, username: 1, level: 1 },
    );

    if (!doc) {
      return ResponseHandler.handleNotFound(res, {
        errorType: "admin-not-found",
        message: "No such admin exists",
      });
    }

    if (!compareCryptos(encodedPass, doc.password)) {
      return ResponseHandler.handleUnauthorized(res, {
        errorType: "admin-invalid-credentials",
        message: "Password is incorrect",
      });
    }

    // Sign Bearer Token
    const token = signJWTwithCrypto(
      { id: doc.id, level: doc.level },
      { expiresIn: "7d" },
    );
    const refreshToken = signJWTwithCrypto(
      { id: doc.id, refresh: true },
      { expiresIn: "30d" },
    );

    // Updating session data of user
    req.session.user = {
      id: doc.id,
      email: doc.email,
      userType: doc.level,
    };
    req.session.resetMaxAge();
    req.session.save();

    // Send, bearer, refresh token and other details
    ResponseHandler.handleSuccess(res, {
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
      message: "Failed to login as admin",
    });
  }
};
