import { ResponseHandler } from "@/middlewares/request.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import * as generalControllers from "../general/space.js";

export const getSpaces = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getSpaces(req, res);
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-spaces-error-failure",
      message: "Failed to get spaces list",
    });
  }
};

export const getSpace = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getSpace(req, res);
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-space-error-failure",
      message: "Failed to get space details",
    });
  }
};
