import { City } from "@/database/models/state-cities.js";
import {
  AreasUpdateMQ,
  areasUpdateMQ,
} from "@/utils/services/rabbitmq/rabbitmq.js";

export const pushMicroMarkets = async (
  marketsData: { city: string; markets: string[] }[],
) => {
  try {
    const existingCities = await City.find();
    const filteredCities = marketsData.filter(
      (marketData) =>
        !existingCities.some(
          (city) =>
            city.name.trim().toLowerCase() ===
            marketData.city.trim().toLowerCase(),
        ),
    );
    console.log(
      "Filtered data :",
      filteredCities.length,
      "/",
      marketsData.length,
    );

    // Create batch of 10 each to send message
    const batches = filteredCities.reduce(
      (prev, curr, i) => {
        if (i % 10 === 0) {
          prev[prev.length] = [];
        }
        prev[prev.length - 1].push(curr);
        return prev;
      },
      [] as { city: string; markets: string[] }[][],
    );
    batches.forEach((batch) => {
      // Send message for each batch
      const marketsPairs = batch.reduce(
        (prev, curr, i) => {
          prev.push(
            ...curr.markets.map((market) => ({
              city: curr.city,
              area: market,
            })),
          );
          return prev;
        },
        [] as AreasUpdateMQ["pairs"],
      );
      areasUpdateMQ.sendMessage({ pairs: marketsPairs });
    });
  } catch (err) {}
};
