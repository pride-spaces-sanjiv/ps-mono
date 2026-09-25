// import { firstValueFrom, lastValueFrom } from "rxjs";
// import { geoAdapter } from "./instance.js";
// import {
//   OverpassElement,
//   OverpassError,
// } from "@andreasnicolaou/overpass-client";

// type NearbyPlacesOpts = {
//   radius: number;
//   lat: number;
//   lng: number;
// };

// export { OverpassError, OverpassElement };

// export const getNearbyPlaces = async (opts: Partial<NearbyPlacesOpts> = {}) => {
//   const stats = {
//     radius: 0,
//     places: [] as OverpassElement[],
//     error: null as null | Error | OverpassError,
//     errorType: "general" as "overpass" | "general",
//   };
//   try {
//     const { radius = 10000, lat, lng } = opts;
//     stats.radius = radius;

//     if (!lat || !lng) {
//       throw new Error("Latitude and longitude are required");
//     }

//     stats.places = (
//       await firstValueFrom(
//         geoAdapter.getElementsByRadius(
//           {
//             //   aeroway: ["aerodrome"],
//             railway: ["station"],
//             // station: ["subway"],
//           },
//           lat,
//           lng,
//           radius,
//         ),
//       )
//     ).elements;

//     return stats;

//     const overpassResults = (
//       await Promise.allSettled([
//         // firstValueFrom(
//         geoAdapter
//           .getElementsByRadius(
//             {
//               aeroway: ["aerodrome"],
//             },
//             lat,
//             lng,
//             radius,
//           )
//           .subscribe((res) => console.log(res.elements)),
//         // ),

//         // firstValueFrom(
//         geoAdapter
//           .getElementsByRadius(
//             {
//               railway: ["station"],
//               station: ["subway"],
//             },
//             lat,
//             lng,
//             radius,
//           )
//           .subscribe((res) => console.log(res.elements)),
//         // ),
//       ])
//     )
//       .filter((pr) => pr.status === "fulfilled")
//       .map((pr) => pr.value);
//     // stats.places = overpassResults.flatMap((res) => res.elements);
//   } catch (err: any) {
//     stats.error = err;
//     if (err instanceof OverpassError) {
//       console.error("Overpass API error:", err);
//       stats.errorType = "overpass";
//     }
//   }
//   return stats;
// };

import axios from "axios";

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;

  lat?: number;
  lon?: number;

  center?: {
    lat: number;
    lon: number;
  };

  tags?: Record<string, string>;
};

export type OverpassResponse = {
  version: number;
  generator: string;
  elements: OverpassElement[];
};

type NearbyPlacesOpts = {
  radius?: number;
  lat: number;
  lng: number;
};

const domain = "https://tg-iptv.site";

export async function getNearbyPlaces(opts: NearbyPlacesOpts) {
  const { radius = 10000, lat, lng } = opts;
  const query = `
  [out:json][timeout:60];

  (
    // Airports
    nwr(
      around:${radius},
      ${lat},
      ${lng}
    )["aeroway"="aerodrome"];

    // Metro stations
    nwr(
      around:${radius},
      ${lat},
      ${lng}
    )["railway"="station"]["station"="subway"];
  );

  out center;
`;

  const { data } = await axios.post<OverpassResponse>(
    "https://overpass-api.de/api/interpreter",
    // "https://overpass.kumi.systems/api/interpreter",
    `data=${encodeURIComponent(query)}`,
    {
      headers: {
        // Browser-like
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/153.0.0.0 Safari/537.36",

        Accept: "application/json, text/plain, */*",

        "Accept-Language": "en-US,en;q=0.9",

        // Pretend the request came from your website
        Referer: domain.replace(/\/+$/, "").concat("/"),

        Origin: domain.replace(/\/+$/, ""),

        "Content-Type": "application/x-www-form-urlencoded",

        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
      },
      timeout: 60000,
    },
  );
  // console.log(data?.elements);
  return { data, radius };
}
