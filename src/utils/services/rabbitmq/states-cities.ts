import axios from "axios";
import { State, City } from "@/database/models/state-cities.js";
import { sleep } from "@/utils/time.js";
import { AnyBulkWriteOperation, Document, Model } from "mongoose";
import { ModelToRaw } from "@/types/mongoose/document.js";

const APIKEY = process.env.RAPID_API_KEY;

const axioser = axios.create({
  baseURL: "https://wft-geo-db.p.rapidapi.com/v1",
  headers: {
    "Content-Type": "application/json",
    "x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
    "x-rapidapi-key": APIKEY,
  },
});

type StateRes = {
  countryCode: string;
  fipsCode: string;
  isoCode: string;
  name: string;
  wikiDataId: string;
};

type CityRes = {
  id: number;
  wikiDataId: string;
  type: "CITY" | "ADM2";
  city: string;
  name: string;
  latitude: number;
  longitude: number;
  population: number;
};

type GeneralRes<T extends any> = {
  data: T[];
  [k: string]: any;
  metadata: {
    currentOffset: number;
    totalCount: number;
  };
};

const getStates = async (offset = 0) => {
  try {
    const url = `/geo/countries/IN/regions?limit=10&offset=${offset}`;
    console.log("URL :", url);
    const res = await axioser.get<GeneralRes<Partial<StateRes>>>(url);
    const data =
      res?.data && Array.isArray(res.data?.data) ? res.data?.data : null;
    if (res.status === 200 && data) {
      console.log("Successfully fetched states :", res.data.metadata);
      return { data, metadata: res.data.metadata };
    }
    throw new Error("invalid response");
  } catch (err: any) {
    console.error("Error fetching states:", err?.response?.data);
    throw err;
  }
};

const getCities = async (stateCode: string, offset = 0) => {
  try {
    const url = `/geo/countries/IN/regions/${stateCode}/cities?limit=10&offset=${offset}`;
    console.log("URL :", url);
    const res = await axioser.get<GeneralRes<CityRes>>(url);
    const data =
      res?.data && Array.isArray(res.data?.data) ? res.data?.data : null;
    if (res.status === 200 && data) {
      console.log("Successfully fetched cities", res.data.metadata);
      return { data, metadata: res.data.metadata };
    }
    throw new Error("invalid response");
  } catch (err: any) {
    console.error("Error fetching cities:", err?.response?.data);
    throw err;
  }
};

const iterativelyFetchandStore = async <
  T extends any,
  M extends Model<any> = Model<any>,
  Fn extends (...args: any[]) => any = (...args: any[]) => any,
>(
  fetchFunction: Fn,
  args: Parameters<Fn>,
  {
    name = "No name",
    bulkHandle,
    model,
  }: Partial<{
    name: string;
    model: M;
    bulkHandle: (
      data: T[],
    ) => M extends Model<any> ? Parameters<M["bulkWrite"]>[0] : never;
  }> = {},
) => {
  const metrics = { stored: 0, pushed: 0 };
  try {
    let totalCount = 0;
    let fetched = false;
    const stored = [] as Partial<T>[];

    while (!fetched || (totalCount > 0 && stored.length < totalCount)) {
      try {
        const { data, metadata = null } = await fetchFunction(
          ...args,
          stored.length,
        );
        console.log(name, "data:", metadata);
        stored.push(...data);
        totalCount = metadata?.totalCount || totalCount;
        // Bulk
        if (bulkHandle) {
          const bulkRes = await model?.bulkWrite(bulkHandle(data));
          metrics.pushed = metrics.pushed + (bulkRes?.upsertedCount || 0);
        }
      } catch (err: any) {}
      fetched = true;
      await sleep(2);
    }
    metrics.stored = stored.length;
    console.log(name, "Stats metrics :", metrics);
    return { data: stored, metrics };
  } catch (err: any) {
    return { data: [], metrics };
  }
};

export const pushStatesAndCities = async () => {
  try {
    let totalCount = 0;
    let fetched = false;
    const metrics = {
      states: { stored: 0, pushed: 0 },
      cities: { stored: 0, pushed: 0 },
    };
    // const statesData = [] as Partial<StateRes>[];

    // // states
    // while (!fetched || (totalCount > 0 && statesData.length < totalCount)) {
    //   try {
    //     const { data, metadata = null } = await getStates(statesData.length);
    //     console.log("States data:", data);
    //     statesData.push(...data);
    //     totalCount = metadata?.totalCount || totalCount;

    //     const bulkRes = await State.bulkWrite(
    //       data.map((dt) => ({
    //         updateOne: {
    //           filter: { code: dt.isoCode },
    //           update: { name: dt.name, code: dt.isoCode },
    //           upsert: true,
    //         },
    //       })),
    //     );
    //     metrics.states = metrics.states + bulkRes.upsertedCount;
    //   } catch (err: any) {}
    //   fetched = true;
    //   await sleep(2);
    // }

    // States
    const { data: statesData, metrics: stateMetrics } =
      await iterativelyFetchandStore<Partial<StateRes>, typeof State>(
        getStates,
        [],
        {
          name: "States",
          model: State,
          bulkHandle: (data) =>
            data.map((dt) => ({
              updateOne: {
                filter: { code: dt.isoCode },
                update: { name: dt.name, code: dt.isoCode },
                upsert: true,
              },
            })),
        },
      );

    metrics.states = stateMetrics;

    // Cities for state
    const startStateInd = statesData.findIndex((dt) => dt.isoCode === "UP");
    console.log("State ind", startStateInd + 1, statesData.length);
    for (const state of statesData.filter((_, i) => i >= startStateInd + 1)) {
      //   let totalCities = 0;
      //   const { data, metadata = null } = await getStates(statesData.length);
      //   console.log("States data:", data);
      //   statesData.push(...data);
      //   totalCount = metadata?.totalCount || totalCount;

      //   const bulkRes = await State.bulkWrite(
      //     data.map((dt) => ({
      //       updateOne: {
      //         filter: { code: dt.isoCode },
      //         update: { name: dt.name, code: dt.isoCode },
      //         upsert: true,
      //       },
      //     })),
      //   );
      //   metrics.states = metrics.states + bulkRes.upsertedCount;

      // Cities
      const { data: citiesData, metrics: cityMetrics } =
        await iterativelyFetchandStore<Partial<CityRes>, typeof City>(
          getCities,
          [state.isoCode],
          {
            name: "Cities",
            model: City,
            bulkHandle: (data) =>
              data.map((dt) => ({
                updateOne: {
                  filter: { rId: dt.id },
                  update: {
                    name: dt.name,
                    lat: dt.latitude,
                    lng: dt.longitude,
                    state: state.isoCode,
                  },
                  upsert: true,
                },
              })),
          },
        );
      metrics.cities.pushed = metrics.cities.pushed + cityMetrics.pushed;
      metrics.cities.stored = metrics.cities.stored + cityMetrics.stored;
    }

    console.log("Stats :", metrics);
  } catch (err: any) {
    console.error("Error pushing data:", err.message);
  }
};
