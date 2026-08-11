import axios from "axios";
import { locationSchema } from "@/database/schemas/location.js";

export const getLatLngFromMapsURL = async (url: string) => {
  try {
    if (!locationSchema.shape.url.parse(url)) {
      throw new Error("Invalid url", { cause: "maps-url-lat-lng_invalid-url" });
    }
    const res = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    const location = res.headers.location;
    if (!location) {
      throw new Error("No redirect location found", {
        cause: "maps-url-lat-lng_no-redirect",
      });
    }
    const lat = Number(location?.match(/\!3d(-?\d+\.?\d*)/)?.[1]);
    const lng = Number(location?.match(/\!4d(-?\d+\.?\d*)/)?.[1]);
    return { lat, lng, redirectUrl: location };
  } catch (err) {
    throw err;
  }
};
