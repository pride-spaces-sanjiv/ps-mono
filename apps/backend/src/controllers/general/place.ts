import { ResponseHandler } from "@/middlewares/request.js";
import {
  Place,
  placeFields,
} from "@pride-spaces/backend/database/models/place.js";
import { getSpaceOperatorsData } from "@pride-spaces/backend/utils/mongoose/relations/space-operator.js";
import {
  cleanPaginatedData,
  getPaginationProps,
  paginatedResults,
} from "@pride-spaces/backend/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getMultiFilters,
  getRangedFilters,
  getSearchFilters,
} from "@pride-spaces/backend/utils/mongoose/filters.js";
import { handleMongooseError } from "@pride-spaces/backend/utils/mongoose/error.js";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";
import { cleanObject } from "@pride-spaces/common/utils/object/clean.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import { SpaceSchema } from "@pride-spaces/common/utils/schemas/space.js";
import { PipelineStage, Types } from "mongoose";
import { pipelineDBs } from "@pride-spaces/backend/utils/services/pipeline/db.js";
import { dumpUserAction } from "@pride-spaces/backend/utils/data/dumpAction.js";
import {
  dumpActions,
  dumpStatuses,
} from "@pride-spaces/common/utils/data/dump.js";
import { generateSpaceKeyword } from "@pride-spaces/common/utils/data/name-keyword.js";
import {
  areasUpdateMQ,
  emailsMQ,
  spaceSlugMQ,
} from "@pride-spaces/backend/utils/services/rabbitmq/rabbitmq.js";
import { GeneralizedControllers } from "@pride-spaces/backend/types/data/general-controllers.js";
import { ModelToRaw } from "@pride-spaces/backend/types/mongoose/document.js";
import { NearbyPlacesSchema } from "@pride-spaces/common/utils/schemas/location.js";
import { placeTypes } from "@pride-spaces/common/utils/data/place.js";

type ModelType = typeof Place;
type GetOptions = GeneralizedControllers.GetOptions<ModelType>;
type GetAggregateOptions = GeneralizedControllers.GetAggregateOptions;
type CreateOptions = GeneralizedControllers.CreateOptions<
  ModelType,
  ModelToRaw<ModelType>
>;
type UpdateOptions = GeneralizedControllers.UpdateOptions<
  ModelType,
  ModelToRaw<ModelType>
>;
type FieldsAndProjectorsOptions =
  GeneralizedControllers.FieldsAndProjectorsOptions<ModelType>;

// GET
export const getPlaces = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
  options: GetOptions & Partial<FieldsAndProjectorsOptions> = {},
) => {
  try {
    const {
      preFilters = {},
      preProjections = undefined,
      preOptions,
      response: responseOpts,
      allowedProjectionFields = placeFields,
    } = options;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Place,
      allowedProjectionFields,
    );
    const searchFilters = getSearchFilters<typeof Place>(req, {
      fieldMaps: {
        Name: "name",
        Type: "type",
      },
    });
    const multiFilters = getMultiFilters<typeof Place>(req, {
      fieldMaps: {
        Type: "type",
      },
    });

    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Place,
      placeFields,
      { limit: 10 },
      {
        projection: { ...preProjections, ...projectors },
        filter: cleanObject(
          {
            ...preFilters,
            ...searchFilters,
            ...multiFilters,
          },
          { excludeByValues: [""] },
        ),
        options: preOptions,
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        ...responseOpts?.error,
        errorType: responseOpts?.error?.errorType || "get-places-error",
        message: responseOpts?.error?.message || "Failed to get places list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "places-not-found",
        message: responseOpts?.notFound?.message || "No places found",
        data: { ...responseOpts?.notFound?.data, results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Got places list",
      data: {
        ...responseOpts?.success?.data,
        ...data,
      },
    });
  } catch (err) {
    console.error("Error getting places :", err);
    throw err;
  }
};

export const getNearbyPlaces = async (
  req: ManagedRequest<NearbyPlacesSchema, { [k: string]: any }>,
  res: ManagedResponse,
  options: GetAggregateOptions = {},
) => {
  try {
    const {
      preAggregators = [],
      aggregatorHandle,
      preOptions = {},
      response: responseOpts,
    } = options;

    const { page, limit, offset, sortBy, sortOrder } = getPaginationProps(
      req,
      placeFields,
      { limit: 10 },
    );

    const { radius = 5000, ...body } = req.body;

    // Preparing radius filters
    const radiusFilters = body.radiusFilters;
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
          coordinates: [req.body.lng, req.body.lat],
        },
        key: "location",
        distanceField: "distance",
        spherical: true,
        maxDistance: maxRadius,
        query: {
          type: {
            $in: radiusFilters ? Array.from(radiusFiltersTypes) : placeTypes,
          },
        },
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
        total: [{ $count: "count" }],
      },
    });
    if (aggregatorHandle) {
      aggregatorHandle(aggregator);
    }
    console.log("Nearby Places aggregator :", aggregator);

    const [aggr] = await pipelineDBs.PLACE.getAggregateData<{
      data: any[];
      total?: { count: number }[];
    }>({ aggregation: aggregator, options: preOptions });
    console.log("Nearby places aggregated response :", aggr);

    const metrics: Awaited<ReturnType<typeof paginatedResults>>["metrics"] = {
      total: aggr.total?.[0]?.count ?? 0,
      count: aggr.data.length,
      next: 0,
    };
    metrics.next = Math.max(0, metrics.total - offset - metrics.count);

    const results = aggr.data;

    // On results error
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType:
          responseOpts?.notFound?.errorType || "nearby-places-not-found",
        message: responseOpts?.notFound?.message || "No nearby places found",
        data: { ...responseOpts?.notFound?.data, results, page, metrics },
      });
      return;
    }

    const data = results.map((place) =>
      convertDataToJSON(place, { alreadyConverted: true, convertId: true }),
    );
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Got nearby places list",
      data: {
        ...responseOpts?.success?.data,
        results: data,
        metrics: metrics,
      },
    });
  } catch (err) {
    console.error("Error getting nearby places :", err);
    throw err;
  }
};

// // GET SINGLE
// export const getSpace = async (
//   req: ManagedRequest<any, { [k: string]: any }>,
//   res: ManagedResponse,
//   options: GetOptions & Partial<FieldsAndProjectorsOptions> = {},
// ) => {
//   try {
//     const {
//       preFilters = {},
//       preProjections = undefined,
//       preOptions,
//       response: responseOpts,
//       allowedProjectionFields = spaceFields,
//     } = options;

//     const { fields, projectors } = getFieldsandProjectors(
//       req,
//       Space,
//       allowedProjectionFields,
//     );
//     const withOperator =
//       String(req.parsedQuery?.withOperator || "").toLowerCase() === "true";

//     const doc = await pipelineDBs.SPACE.getData({
//       filter: { ...preFilters, _id: req.params.id },
//       projection: { ...preProjections, ...projectors },
//       options: preOptions,
//     });
//     if (!doc) {
//       ResponseHandler.handleNotFound(res, {
//         ...responseOpts?.notFound,
//         errorType: responseOpts?.notFound?.errorType || "space-not-found",
//         message: responseOpts?.notFound?.message || "Space not found",
//       });
//       return;
//     }

//     const data = convertDataToJSON(doc);
//     const operators = withOperator
//       ? (await getSpaceOperatorsData([data?.operator as string])).map((d) =>
//           convertDataToJSON(d),
//         )
//       : [];
//     ResponseHandler.handleSuccess(res, {
//       ...responseOpts?.success,
//       data: {
//         ...responseOpts?.success?.data,
//         ...data,
//         references: withOperator ? { operator: operators[0] } : undefined,
//       },
//     });
//   } catch (err) {
//     console.error("Error getting space :", err);
//     throw err;
//     // ResponseHandler.handleError(res, {
//     //   errorType: "get-space-error-failure",
//     //   message: "Failed to get space details",
//     // });
//   }
// };

// // CREATE
// export const createSpace = async (
//   req: ManagedRequest<Partial<SpaceSchema>>,
//   res: ManagedResponse,
//   options: CreateOptions = {},
// ) => {
//   try {
//     const {
//       preBody,
//       bodyHandle,
//       dumpDataHandle,
//       response: responseOpts,
//       onlyDump = false,
//       skipDump = false,
//       dumpArgs,
//       queueSlugGen = true,
//     } = options;

//     // Body creation
//     let body = {
//       ...preBody,
//       ...req.body,
//       fullKeyword: generateSpaceKeyword(req.body?.name || "") || undefined,
//       slug: queueSlugGen
//         ? req.body.slug
//             ?.replace(/\-[0-9]*$/g, "")
//             .concat(`-${new Date().getTime()}`)
//         : req.body.slug,
//     } as SpaceSchema;
//     if (bodyHandle) {
//       body = await bodyHandle(body);
//     }

//     // Handle city-area on upload
//     if (body.location?.city && body.location?.area) {
//       areasUpdateMQ.sendMessage({
//         pairs: [
//           {
//             city: body?.location?.city?.trim(),
//             area: body?.location?.area?.trim(),
//           },
//         ],
//       });
//     }

//     const id = new Types.ObjectId().toHexString();

//     // Dump handle
//     if (!skipDump) {
//       let dumpData = { ...dumpArgs?.dump?.data, ...body };
//       if (dumpDataHandle) {
//         dumpData = await dumpDataHandle(dumpData);
//       }

//       const dumpRes = await dumpUserAction({
//         ...dumpArgs,
//         isNew: true,
//         // @ts-ignore
//         dump: {
//           ...dumpArgs?.dump,
//           collection: "spaces",
//           data: dumpData,
//           metadata: {
//             id: id,
//             name: body.name,
//           },
//           action: "add",
//         },
//         req: req,
//       });
//       if (dumpRes.disAllowed || dumpRes.levelInvalid) {
//         ResponseHandler.handleUnauthorized(res, {
//           errorType: "dump-unauthorized",
//           message: "Dump action was unauthorized",
//         });
//         return;
//       }
//       if (dumpRes.error) {
//         ResponseHandler.handleUnauthorized(res, {
//           errorType: "dump-failed",
//           message: "Dump action was failed",
//         });
//         return;
//       }
//     }

//     // Allowed to create
//     if (!onlyDump) {
//       const doc = await pipelineDBs.SPACE.createData({
//         // @ts-ignore
//         data: body,
//       });

//       if (queueSlugGen) {
//         spaceSlugMQ.sendMessage({
//           id: doc.id,
//         });
//       }

//       const data = convertDataToJSON(doc);
//       ResponseHandler.handleSuccess(res, {
//         ...responseOpts?.success,
//         status: responseOpts?.success?.status || 201,
//         message: responseOpts?.success?.message || "Created space successfully",
//         data: { ...responseOpts?.success?.data, ...data },
//       });
//       return;
//     }

//     // Allowed to dump only
//     const doc = Space.hydrate({ _id: id, ...body });
//     const data = convertDataToJSON(doc);
//     ResponseHandler.handleSuccess(res, {
//       ...responseOpts?.success,
//       status: responseOpts?.success?.status || 201,
//       message:
//         responseOpts?.success?.message || "Dumped new space successfully",
//       data: { ...responseOpts?.success?.data, ...data },
//     });
//   } catch (err: any) {
//     const errorData = handleMongooseError(err, res, {
//       uniqueError: {
//         errorType: "space-unique-error",
//         msgPre: "Space",
//       },
//     });
//     if (errorData.handled) {
//       return;
//     }
//     console.error("Error creating space :", err);
//     throw err;
//     // ResponseHandler.handleError(res, {
//     //   errorType: "create-user-error-failure",
//     //   message: "Failed to create user",
//     // });
//   }
// };

// // UPDATE
// export const updateSpace = async (
//   req: ManagedRequest<Omit<Partial<SpaceSchema>, "branch" | "operator">>,
//   res: ManagedResponse,
//   options: UpdateOptions = {},
// ) => {
//   try {
//     const {
//       preBody,
//       bodyHandle,
//       dumpDataHandle,
//       proceedToProcess,
//       response: responseOpts,
//       preFilters,
//       preProjections,
//       preOptions,
//       onlyDump = false,
//       skipDump = false,
//       dumpArgs,
//     } = options;

//     // Body creation
//     let body = {
//       ...preBody,
//       ...req.body,
//       fullKeyword: generateSpaceKeyword(req.body?.name || "") || undefined,
//     } as SpaceSchema;
//     if (bodyHandle) {
//       body = await bodyHandle(body);
//     }

//     const id = req.params.id;

//     // Check exists or not first
//     let doc = await pipelineDBs.SPACE.getData({
//       filter: { ...preFilters, _id: id },
//       projection: { ...preProjections },
//       options: { ...preOptions },
//     });
//     if (!doc) {
//       ResponseHandler.handleNotFound(res, {
//         ...responseOpts?.notFound,
//         errorType: responseOpts?.notFound?.errorType || "space-not-found",
//         message: responseOpts?.notFound?.message || "Space not found",
//       });
//       return;
//     }

//     // Mid process flow handler
//     if (proceedToProcess) {
//       const shouldProceed = await proceedToProcess(body, doc);
//       if (!shouldProceed) {
//         return;
//       }
//     }

//     // Handle city-area on upload
//     if (
//       body.location?.city &&
//       body.location?.area &&
//       doc.isSelected("location.city") &&
//       doc.location?.city !== body.location.city
//     ) {
//       areasUpdateMQ.sendMessage({
//         pairs: [
//           {
//             city: body?.location?.city?.trim(),
//             area: body?.location?.area?.trim(),
//           },
//         ],
//       });
//     }

//     // Dump handle
//     if (!skipDump) {
//       let dumpData = { ...dumpArgs?.dump?.data, ...body };
//       if (dumpDataHandle) {
//         dumpData = await dumpDataHandle(dumpData);
//       }

//       const dumpRes = await dumpUserAction({
//         ...dumpArgs,
//         isNew: true,
//         // @ts-ignore
//         dump: {
//           ...dumpArgs?.dump,
//           collection: "spaces",
//           data: dumpData,
//           metadata: {
//             id: id,
//             name: doc.name,
//           },
//           action: "update",
//         },
//         req: req,
//       });
//       if (dumpRes.disAllowed || dumpRes.levelInvalid) {
//         ResponseHandler.handleUnauthorized(res, {
//           errorType: "dump-unauthorized",
//           message: "Dump action was unauthorized",
//         });
//         return;
//       }
//       if (dumpRes.error) {
//         ResponseHandler.handleUnauthorized(res, {
//           errorType: "dump-failed",
//           message: "Dump action was failed",
//         });
//         return;
//       }
//     }

//     // Allowed to update
//     if (!onlyDump) {
//       doc = await pipelineDBs.SPACE.updateData({
//         filter: { ...preFilters, _id: id },
//         updateData: body,
//         options: {
//           ...preOptions,
//           new: true,
//         },
//       });

//       if (!doc) {
//         ResponseHandler.handleNotFound(res, {
//           ...responseOpts?.notFound,
//           errorType: responseOpts?.notFound?.errorType || "space-not-found",
//           message: responseOpts?.notFound?.message || "Space not found",
//         });
//         return;
//       }
//       const data = convertDataToJSON(doc);
//       ResponseHandler.handleSuccess(res, {
//         ...responseOpts?.success,
//         message: responseOpts?.success?.message || "Space updated successfully",
//         data: { ...responseOpts?.success?.data, ...data },
//       });
//       return;
//     }

//     // Allowed to dump only
//     const data = convertDataToJSON(doc);
//     ResponseHandler.handleSuccess(res, {
//       ...responseOpts?.success,
//       message:
//         responseOpts?.success?.message || "Dumped space data successfully",
//       data: { ...responseOpts?.success?.data, ...data },
//     });
//   } catch (err: any) {
//     const errorData = handleMongooseError(err, res, {
//       uniqueError: {
//         errorType: "space-unique-error",
//         msgPre: "Space",
//       },
//     });
//     if (errorData.handled) {
//       return;
//     }
//     console.error("Error updating space :", err);
//     throw err;
//     // ResponseHandler.handleError(res, {
//     //   errorType: "update-space-error-failure",
//     //   message: "Failed to update space details",
//     // });
//   }
// };

// // DELETE
// export const deleteSpace = async (
//   req: ManagedRequest,
//   res: ManagedResponse,
//   options: GetOptions &
//     Pick<CreateOptions, "onlyDump" | "skipDump" | "dumpArgs"> = {},
// ) => {
//   try {
//     const {
//       preFilters,
//       preProjections,
//       preOptions,
//       onlyDump = false,
//       skipDump = false,
//       dumpArgs,
//       response: responseOpts,
//     } = options;

//     const id = req.params.id;

//     // Check exists or not first
//     let doc = await pipelineDBs.SPACE.getData({
//       filter: { ...preFilters, _id: id },
//       projection: { ...preProjections },
//       options: { ...preOptions },
//     });
//     if (!doc) {
//       ResponseHandler.handleNotFound(res, {
//         ...responseOpts?.notFound,
//         errorType: responseOpts?.notFound?.errorType || "space-not-found",
//         message: responseOpts?.notFound?.message || "Space not found",
//       });
//       return;
//     }

//     // Dump handle
//     if (!skipDump) {
//       const dumpRes = await dumpUserAction({
//         ...dumpArgs,
//         isNew: true,
//         // @ts-ignore
//         dump: {
//           ...dumpArgs?.dump,
//           collection: "spaces",
//           data: {
//             ...dumpArgs?.dump?.data,
//             id: id,
//             name: doc.name,
//           },
//           metadata: {
//             id: id,
//             name: doc.name,
//           },
//           action: dumpActions.REMOVE,
//         },
//         req: req,
//       });
//       if (dumpRes.disAllowed || dumpRes.levelInvalid) {
//         ResponseHandler.handleUnauthorized(res, {
//           errorType: "dump-unauthorized",
//           message: "Dump action was unauthorized",
//         });
//         return;
//       }
//       if (dumpRes.error) {
//         ResponseHandler.handleUnauthorized(res, {
//           errorType: "dump-failed",
//           message: "Dump action was failed",
//         });
//         return;
//       }
//     }

//     // Allowed to delete directly
//     if (!onlyDump) {
//       doc = await pipelineDBs.SPACE.deleteData({
//         filter: { ...preFilters, _id: id },
//         options: { ...preOptions },
//       });
//       if (!doc) {
//         ResponseHandler.handleNotFound(res, {
//           ...responseOpts?.notFound,
//           errorType: responseOpts?.notFound?.errorType || "space-not-found",
//           message: responseOpts?.notFound?.message || "Space not found",
//         });
//         return;
//       }
//       const data = convertDataToJSON(doc);
//       ResponseHandler.handleSuccess(res, {
//         ...responseOpts?.success,
//         message: responseOpts?.success?.message || "Space deleted successfully",
//         data: { ...responseOpts?.success?.data, ...data },
//       });
//       return;
//     }

//     // Allowed to dump only
//     const data = convertDataToJSON(doc);
//     ResponseHandler.handleSuccess(res, {
//       ...responseOpts?.success,
//       message:
//         responseOpts?.success?.message || "Dumped space deletion successfully",
//       data: { ...responseOpts?.success?.data, ...data },
//     });
//   } catch (err) {
//     console.error("Error deleting space :", err);
//     throw err;
//     // ResponseHandler.handleError(res, {
//     //   errorType: "delete-space-error-failure",
//     //   message: "Failed to delete space",
//     // });
//   }
// };
