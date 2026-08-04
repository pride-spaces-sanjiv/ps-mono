import { ENV } from "../src/utils/env";
ENV;
import { pushMicroMarkets } from "../src/utils/scripts/bulk/cities";
const { default: allCities } =
  await import("../data/cities/cities-markets.json");

pushMicroMarkets(
  allCities.map((city) => ({
    city: city.name.trim(),
    markets: city.areas.map((area) => area.name.trim()),
  })),
);
