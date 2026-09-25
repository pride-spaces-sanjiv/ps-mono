import { ResponseHandler } from "@/middlewares/request.js";
import { getLatLngFromMapsURL } from "@pride-spaces/backend/utils/data/geocode.js";
import {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import * as findPlacesUtil from "@pride-spaces/backend/utils/services/geo/find-place.js";
import { NearbyPlacesSchema } from "@pride-spaces/common/utils/schemas/location.js";
import { AxiosError, AxiosResponse } from "axios";

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
    const { data, radius } = await findPlacesUtil.getNearbyPlaces({
      lat,
      lng,
      radius: req.body?.radius,
    });
    const places = data?.elements || [];

    if (!places || places.length <= 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "places-not-found",
        message: "No places found nearby",
        data: { lat, lng, places, radius },
      });
      return;
    }

    // Send the location data in the response
    ResponseHandler.handleSuccess(res, {
      data: { lat, lng, places, radius },
    });
  } catch (err: any) {
    console.error("Error getting nearby places :", err);

    if (err instanceof AxiosError) {
      const resp = err.response || (err.request?.response as AxiosResponse);
      ResponseHandler.handleError(res, {
        errorType: "places-overpass-error",
        message: "Overpass failure caused",
        data: {
          statusCode: resp?.status,
          statusMessage: resp?.statusText,
        },
      });
      return;
    }

    ResponseHandler.handleError(res, {
      errorType: "places-general-error",
      message: "Failed to get nearby places",
    });
  }
};
