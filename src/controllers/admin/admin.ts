import { ResponseHandler } from "@/middlewares/request.js";
import { Admin } from "@/database/models/user.js";
import moment from "moment";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { encodeCrypto } from "@/utils/crypto.js";
import { decodeJWTwithCrypto, signJWTwithCrypto } from "@/utils/jwt.js";
import { type AdminSchema } from "@/database/schemas/user.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";

export const createAdmin = async (
  req: ManagedRequest<AdminSchema>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const encodedPass = encodeCrypto(body.password);
    const doc = new Admin({
      ...body,
      password: encodedPass,
    });
    await doc.save();

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "create-admin-error",
      message: "Failed to create admin",
    });
  }
};
