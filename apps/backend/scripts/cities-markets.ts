import axios from "axios";
import { sleep } from "../src/utils/time";
import { writeFileSync } from "fs";
import path from "path";
import moment from "moment";
// const { default: allCities } = await import("../data/cities/all-cities.json");
const { default: allCities } =
  await import("../data/cities/stylework-cities.json");

interface Locality {
  googlePlaceId: string;
  name: string;
  slug: string;
}

interface LocalitiesData {
  popularLocations: Partial<Locality>[];
}

interface LocalitiesRes {
  success: boolean;
  data: Partial<LocalitiesData>;
}

type Stylework = {
  locality: Record<"id" | "name" | "slug", string>;
  response: { data: Partial<Stylework["locality"]>[] };
};

const getMarketsInCity = async (citySlug: string) => {
  const res = await axios.post<Partial<LocalitiesRes>>(
    "https://api.web.myhq.in/workspace/web/in/filters/localities",
    {
      selectedFilters: {
        PRODUCT: "DEDICATED",
        CITY: citySlug,
        LOCALITIES: [],
        SORT_BY: "POPULARITY",
        BRANDS: [],
      },
    },
    {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Referer-Policy": "unsafe-url",
        "Sec-Ch-Ua":
          '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "X-Myhq-Session-Id": "9c033989-93df-4d6c-a748-498ef8853757",
        Referer: "https://myhq.in/",
      },
    },
  );

  const localities = (res.data?.data?.popularLocations || [])
    .map((dt) => ({ name: dt.name?.trim() || "", slug: dt.slug?.trim() || "" }))
    .filter((dt) => dt.name?.trim() && dt.slug?.trim());
  return localities;
};

const getStyleWorkMarketsInCity = async (citySlug: string) => {
  // Stylework
  const res = await axios.get<Partial<Stylework["response"]>>(
    `https://serverapi.stylework.city/website/v3/locality?cityslug=${citySlug}`,
    {
      headers: {
        Accept: "application/json, text/plain, */*",
        // "Content-Type": "application/json",
        // "Referer-Policy": "unsafe-url",
        // "Sec-Ch-Ua":
        //   '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
        // "Sec-Ch-Ua-Mobile": "?0",
        // "Sec-Ch-Ua-Platform": '"Windows"',
        // "X-Myhq-Session-Id": "9c033989-93df-4d6c-a748-498ef8853757",
        // Referer: "https://myhq.in/",
      },
    },
  );

  const localities = (res.data?.data || [])
    .map((dt) => ({ name: dt.name?.trim() || "", slug: dt.slug?.trim() || "" }))
    .filter((dt) => dt.name?.trim() && dt.slug?.trim());
  return localities;
};

const getLocalitiesForCities = async () => {
  const filteredCities = allCities.filter(
    (city) => city.currency.toLowerCase().trim() === "inr",
  );
  const startTime = Date.now();
  for (let i = 0; i < filteredCities.length; i++) {
    const city = filteredCities[i];
    try {
      const markets = await getStyleWorkMarketsInCity(city.slug);
      console.log("Localities :", { city: city.name, markets: markets.length });
      const duration = moment.duration(Date.now() - startTime);
      console.log(
        "Duration :",
        `${duration.hours().toString().padStart(2, "0")}:${duration.minutes().toString().padStart(2, "0")}:${duration.seconds().toString().padStart(2, "0")}`,
      );
      // @ts-ignore
      filteredCities[i].areas = markets;
      await sleep(1);
    } catch (err) {}
    console.log(
      `Remaining : ${filteredCities.length - i - 1} / ${filteredCities.length}`,
    );
    writeFileSync(
      path.join(import.meta.dirname, "../data/cities/cities-markets.json"),
      JSON.stringify(filteredCities),
    );
  }
  writeFileSync(
    path.join(import.meta.dirname, "../data/cities/cities-markets.json"),
    JSON.stringify(filteredCities),
  );
};
// getLocalitiesForCities();
