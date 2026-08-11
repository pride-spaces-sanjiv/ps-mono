import { RequestMiddleware, ResponseHandler } from "@/middlewares/request.js";
import { adminLevels } from "@/utils/data/admin.js";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";

const allLevels = [...adminLevels, "operator", "user"] as const;

export const getTokenInfo = async (
  req: ManagedRequest,
  res: ManagedResponse,
) => {
  try {
    const token = (req.headers.authorization || "")
      .replace("Bearer ", "")
      .trim();
    if (!token) {
      return ResponseHandler.handleError(res, {
        errorType: "token-empty",
        message: "No authorization token provided",
      });
    }

    // Decrypt data from token
    const decrypted = RequestMiddleware.decryptUserAuthToken(token);
    // Invalid token
    if (!decrypted) {
      return ResponseHandler.handleError(res, {
        errorType: "token-invalid",
        message: "Invalid authorization token provided",
      });
    }
    // Expired
    if (decrypted.expiry <= Date.now()) {
      return ResponseHandler.handleError(res, {
        errorType: "token-expired",
        message: "Authorization token has expired",
      });
    }
    if (
      !allLevels.includes(
        (decrypted.data?.level || "") as (typeof allLevels)[number],
      ) ||
      !decrypted.data?.id
    ) {
      return ResponseHandler.handleError(res, {
        errorType: "token-invalid",
        message: "Invalid authorization token provided",
      });
    }
    ResponseHandler.handleSuccess(res, {
      message: "Token details retrieved successfully",
      data: { level: decrypted.data.level },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "token-info-error-failure",
      message: "Failed to retrieve token information",
    });
  }
};
