import { getPaginationProps } from "@/utils/mongoose/pagination.js";
import {
  nearbyPlacesSchema,
  NearbyPlacesSchema,
} from "@pride-spaces/common/utils/schemas/location.js";
import { AggregateOptions, PipelineStage } from "mongoose";
import { pipelineDBs } from "../pipeline/db.js";
import { PlaceType } from "@pride-spaces/common/utils/data/place.js";

export type GetNearbyPlacesFromLocOpts = Partial<{
  preAggregators: PipelineStage[];
  aggregatorHandle: (aggregators?: PipelineStage[]) => PipelineStage[];
  preOptions: AggregateOptions;
  paginationProps: Partial<
    Omit<ReturnType<typeof getPaginationProps>, "err" | "errored">
  >;
}>;

export const getNearbyPlacesFromLoc = async (
  data: NearbyPlacesSchema,
  options: GetNearbyPlacesFromLocOpts = {},
) => {
  try {
    const {
      paginationProps = {},
      preAggregators = [],
      aggregatorHandle,
      preOptions = {},
    } = options;
    const {
      page = 1,
      limit = 10,
      offset = 0,
      sortBy = "",
      sortOrder = "desc",
    } = paginationProps;

    const { radius = 5000 } = data;

    // Preparing radius filters
    const radiusFilters = data.radiusFilters;
    const radiusFiltersTypes = new Set(radiusFilters?.map((f) => f.type) || []);

    const aggregator: PipelineStage[] = [...preAggregators];
    const maxRadius = radiusFilters
      ? // Prepare firstly with geoNear aggr to attend all places picked up for the max radius of all
        Math.max(...radiusFilters.map((filter) => filter.radius))
      : radius;
    aggregator.push({
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [data.lng, data.lat],
        },
        key: "location",
        distanceField: "distance",
        spherical: true,
        maxDistance: maxRadius,
        query:
          radiusFilters || data.types
            ? {
                type: {
                  $in: radiusFilters
                    ? Array.from(radiusFiltersTypes)
                    : data.types,
                },
              }
            : {},
      },
    });
    // Only filter matches that bound within max radius passed to them
    radiusFilters &&
      aggregator.push({
        $match: {
          $or: radiusFilters.map((filter) => ({
            type: filter.type,
            distance: { $lte: filter.radius },
          })),
        },
      });
    aggregator.push({
      $facet: {
        data: [
          { $skip: offset },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              name: 1,
              type: 1,
              lat: {
                $arrayElemAt: ["$location.coordinates", 1],
              },
              lng: {
                $arrayElemAt: ["$location.coordinates", 0],
              },
              distance: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        counts: [
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    });
    if (aggregatorHandle) {
      aggregatorHandle(aggregator);
    }
    console.log("Nearby Places aggregator :", aggregator);

    const aggr = await pipelineDBs.PLACE.getAggregateData<{
      data: any[];
      total?: { count: number }[];
      counts?: { _id: string; count: number }[];
    }>({ aggregation: aggregator, options: preOptions });
    const results = aggr.map<
      (typeof aggr)[number] &
        Partial<{ totalCounts?: Record<PlaceType, number> }>
    >((item) => {
      if (item?.counts) {
        const totalCounts = Object.fromEntries(
          item.counts.map(({ _id, count }) => [_id, count]),
        ) as Record<PlaceType, number>;
        return { ...item, totalCounts };
      }
      return item;
    });
    return results;
  } catch (err) {
    throw err;
  }
};
