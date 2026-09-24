import { firstValueFrom, lastValueFrom } from "rxjs";
import { geoAdapter } from "./instance.js";
import {
  OverpassElement,
  OverpassError,
} from "@andreasnicolaou/overpass-client";

type NearbyPlacesOpts = {
  radius: number;
  lat: number;
  lng: number;
};

export { OverpassError, OverpassElement };

export const getNearbyPlaces = async (opts: Partial<NearbyPlacesOpts> = {}) => {
  const stats = {
    radius: 0,
    places: [] as OverpassElement[],
    error: null as null | Error | OverpassError,
    errorType: "general" as "overpass" | "general",
  };
  try {
    const { radius = 10000, lat, lng } = opts;
    stats.radius = radius;

    if (!lat || !lng) {
      throw new Error("Latitude and longitude are required");
    }

    const overpassResults = (
      await Promise.allSettled([
        lastValueFrom(
          geoAdapter.getElementsByRadius(
            {
              aeroway: ["aerodrome"],
            },
            lat,
            lng,
            radius,
          ),
        ),

        lastValueFrom(
          geoAdapter.getElementsByRadius(
            {
              railway: ["station"],
              station: ["subway"],
            },
            lat,
            lng,
            radius,
          ),
        ),
      ])
    )
      .filter((pr) => pr.status === "fulfilled")
      .map((pr) => pr.value);
    stats.places = overpassResults.flatMap((res) => res.elements);
  } catch (err: any) {
    stats.error = err;
    if (err instanceof OverpassError) {
      console.error("Overpass API error:", err);
      stats.errorType = "overpass";
    }
  }
  return stats;
};
