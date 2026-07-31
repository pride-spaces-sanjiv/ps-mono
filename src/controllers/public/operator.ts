import { ResponseHandler } from "@/middlewares/request.js";
import * as generalControllers from "@/controllers/general/operator.js";
// types
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";

export const getOperators = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getOperators(req, res, {
      preProjections: { password: 0 },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-operators-error-failure",
      message: "Failed to get operators list",
    });
  }
};

export const getOperator = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getOperator(req, res, {
      preProjections: { password: 0 },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-operator-error-failure",
      message: "Failed to get operator details",
    });
  }
};
