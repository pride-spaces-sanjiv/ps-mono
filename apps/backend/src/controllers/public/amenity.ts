import { ResponseHandler } from "@/middlewares/request.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import * as generalControllers from "@/controllers/general/amenity.js";

export const getAmenities = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getAmenities(req, res);
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-amenities-error-failure",
      message: "Failed to get amenities list",
    });
  }
};

export const getAmenity = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getAmenity(req, res);
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-amenity-error-failure",
      message: "Failed to get amenity details",
    });
  }
};
