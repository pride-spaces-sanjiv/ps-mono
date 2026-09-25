import { OverpassClient } from "@andreasnicolaou/overpass-client";

export const geoAdapter = new OverpassClient(
  "https://overpass.kumi.systems/api/interpreter",
);
