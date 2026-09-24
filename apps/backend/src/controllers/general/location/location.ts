import { ResponseHandler } from "@/middlewares/request.js";
import { getLatLngFromMapsURL } from "@pride-spaces/backend/utils/data/geocode.js";
import {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import * as findPlacesUtil from "@pride-spaces/backend/utils/services/geo/find-place.js";
import { NearbyPlacesSchema } from "@pride-spaces/common/utils/schemas/location.js";

type OverpassError = findPlacesUtil.OverpassError;

export const getLocationFromMapsURL = async (
  req: ManagedRequest<{ url: string }>,
  res: ManagedResponse,
) => {
  try {
    const { url } = req.body;
    // Call the geocode utility function
    const { lat, lng, redirectUrl } = await getLatLngFromMapsURL(url);
    // Send the location data in the response
    ResponseHandler.handleSuccess(res, {
      data: { lat, lng, url, redirectUrl },
    });
  } catch (err: any) {
    console.error("Error parsing maps url details :", err);
    if (
      err instanceof Error &&
      (err.cause as string)?.includes("maps-url-lat-lng_")
    ) {
      const cause = (err.cause as string).split("_")[1];
      ResponseHandler.handleError(res, {
        message: err.message,
        errorType: `maps-parser-error-${cause}`,
      });
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "maps-parser-error-failure",
      message: "Failed to parse location from maps URL",
    });
  }
};

export const getNearbyPlaces = async (
  req: ManagedRequest<NearbyPlacesSchema>,
  res: ManagedResponse,
) => {
  try {
    const { lat, lng } = req.body;

    // Call the nearby util
    const { places, error, errorType, radius } =
      await findPlacesUtil.getNearbyPlaces({
        lat,
        lng,
        radius: req.body?.radius,
      });

    if (error) {
      if (errorType === "overpass") {
        ResponseHandler.handleError(res, {
          errorType: "places-overpass-error",
          message: error.message,
        });
        return;
      }
      throw error;
    }

    // Send the location data in the response
    ResponseHandler.handleSuccess(res, {
      data: { lat, lng, places, radius },
    });
  } catch (err: any) {
    console.error("Error getting nearby places :", err);
    ResponseHandler.handleError(res, {
      errorType: "places-general-error",
      message: "Failed to get nearby places",
    });
  }
};
