import axios from "axios";
import { locationSchema } from "../schemas/location";

export const parseAddress = (
  components: google.maps.GeocoderResult["address_components"],
) => {
  //   console.log(components);
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name;

  return {
    country: get("country"),
    state: get("administrative_area_level_1"),
    city: get("locality") || get("administrative_area_level_2"),
    area:
      get("sublocality") ||
      get("neighborhood") ||
      get("administrative_area_level_3"),
    postalCode: get("postal_code"),
  };
};

export const geocodeLatLng = (lat: number, lng: number) => {
  return new Promise<ReturnType<typeof parseAddress> & { address: string }>(
    (resolve, reject) => {
      if (!window.google) return reject("Google not loaded");

      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.length) {
          // console.log(results);
          const parsed = parseAddress(results[0].address_components);
          resolve({ ...parsed, address: results[0].formatted_address });
        } else {
          reject(status);
        }
      });
    },
  );
};

export const getLatLngFromMapsURL = async (url: string) => {
  try {
    if (!locationSchema.shape.url.parse(url)) {
      throw new Error("Invalid url", { cause: "maps-url-lat-lng_invalid-url" });
    }
    const res = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: (st) => st >= 200 && st < 400,
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
