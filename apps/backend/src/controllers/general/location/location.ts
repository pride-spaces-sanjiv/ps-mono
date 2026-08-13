import { ResponseHandler } from "@/middlewares/request.js";
import { getLatLngFromMapsURL } from "@/utils/data/geocode.js";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";

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
