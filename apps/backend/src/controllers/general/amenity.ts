import { ResponseHandler } from "@/middlewares/request.js";
import {
  Amenity,
  amenityFields,
} from "@pride-spaces/backend/database/models/amenities.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@pride-spaces/backend/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getSearchFilters,
} from "@pride-spaces/backend/utils/mongoose/filters.js";
import { handleMongooseError } from "@pride-spaces/backend/utils/mongoose/error.js";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";
import { cleanObject } from "@pride-spaces/common/utils/object/clean.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import { AmenitySchema } from "@pride-spaces/backend/database/schemas/amenity.js";
import { pipelineDBs } from "@pride-spaces/backend/utils/services/pipeline/db.js";
import { GeneralizedControllers } from "@pride-spaces/backend/types/data/general-controllers.js";

type ModelType = typeof Amenity;
type GetOptions = GeneralizedControllers.GetOptions<ModelType>;
type CreateOptions = GeneralizedControllers.CreateOptions<
  ModelType,
  AmenitySchema
>;
type UpdateOptions = GeneralizedControllers.UpdateOptions<
  ModelType,
  AmenitySchema
>;
type FieldsAndProjectorsOptions =
  GeneralizedControllers.FieldsAndProjectorsOptions<ModelType>;

export const getAmenities = async (
  req: ManagedRequest<any>,
  res: ManagedResponse,
  options: GetOptions & Partial<FieldsAndProjectorsOptions> = {},
) => {
  try {
    const {
      preFilters = {},
      preProjections = undefined,
      preOptions,
      response: responseOpts,
      allowedProjectionFields = amenityFields,
    } = options;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Amenity,
      allowedProjectionFields,
    );

    const searchFilters = getSearchFilters<typeof Amenity>(req, {
      fieldMaps: {
        Name: "name",
        Category: "category",
        Icon: "icon",
      },
    });

    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Amenity,
      amenityFields,
      { limit: 10 },
      {
        projection: { ...preProjections, ...projectors },
        filter: cleanObject(
          { ...preFilters, ...searchFilters },
          { excludeByValues: [""] },
        ),
        options: preOptions,
      },
    );

    if (errored && err) {
      ResponseHandler.handleError(res, {
        ...responseOpts?.error,
        errorType: responseOpts?.error?.errorType || "get-amenities-error",
        message: responseOpts?.error?.message || "Failed to get amenities",
      });
      return;
    }

    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "amenities-not-found",
        message: responseOpts?.notFound?.message || "No amenities found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });

    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Got amenities list",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err) {
    throw err;
  }
};

// GET SINGLE
export const getAmenity = async (
  req: ManagedRequest,
  res: ManagedResponse,
  options: GetOptions & Partial<FieldsAndProjectorsOptions> = {},
) => {
  try {
    const {
      preFilters = {},
      preProjections = undefined,
      preOptions,
      response: responseOpts,
      allowedProjectionFields = amenityFields,
    } = options;

    const { projectors } = getFieldsandProjectors(
      req,
      Amenity,
      allowedProjectionFields,
    );

    const doc = await pipelineDBs.AMENITY.getData({
      filter: { ...preFilters, _id: req.params.id },
      projection: { ...preProjections, ...projectors },
      options: preOptions,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "amenity-not-found",
        message: responseOpts?.notFound?.message || "Amenity not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Got amenity",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err) {
    throw err;
  }
};

//  CREATE
export const createAmenity = async (
  req: ManagedRequest<AmenitySchema>,
  res: ManagedResponse,
  options: CreateOptions = {},
) => {
  try {
    const {
      preBody,
      bodyHandle,
      dumpDataHandle,
      response: responseOpts,
      onlyDump = false,
      skipDump = false,
      dumpArgs,
      preOptions,
    } = options;

    let body = { ...preBody, ...req.body };
    if (bodyHandle) {
      body = await bodyHandle(body);
    }

    const doc = await pipelineDBs.AMENITY.createData({
      data: body,
      options: preOptions,
    });

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      status: responseOpts?.success?.status || 201,
      message: responseOpts?.success?.message || "Created amenity successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "amenity-unique-error",
        msgPre: "Amenities",
      },
    });

    if (errorData.handled) {
      return;
    }
    throw err;
  }
};

//  UPDATE
export const updateAmenity = async (
  req: ManagedRequest<Partial<AmenitySchema>>,
  res: ManagedResponse,
  options: UpdateOptions = {},
) => {
  try {
    const {
      preBody,
      bodyHandle,
      proceedToProcess,
      response: responseOpts,
      preFilters,
      preOptions,
      onlyDump = false,
      skipDump = false,
      dumpArgs,
    } = options;

    // Body creation
    let body = {
      ...preBody,
      ...req.body,
    };
    if (bodyHandle) {
      body = await bodyHandle(body);
    }

    const id = req.params.id;
    let doc = await pipelineDBs.AMENITY.updateData({
      filter: { ...preFilters, _id: id },
      updateData: body,
      options: {
        ...preOptions,
        new: true,
      },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "amenity-not-found",
        message: responseOpts?.notFound?.message || "Amenity not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Amenity updated successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "amenity-unique-error",
        msgPre: "Amenities",
      },
    });

    if (errorData.handled) {
      return;
    }
    throw err;
  }
};

//  DELETE
export const deleteAmenity = async (
  req: ManagedRequest,
  res: ManagedResponse,
  options: GetOptions &
    Pick<CreateOptions, "onlyDump" | "skipDump" | "dumpArgs"> = {},
) => {
  try {
    const {
      preFilters,
      preProjections,
      preOptions,
      onlyDump = false,
      skipDump = false,
      dumpArgs,
      response: responseOpts,
    } = options;

    const id = req.params.id;

    const doc = await pipelineDBs.AMENITY.deleteData({
      filter: { ...preFilters, _id: id },
      options: { ...preOptions },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "amenity-not-found",
        message: responseOpts?.notFound?.message || "Amenity not found",
      });
      return;
    }
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Amenity deleted successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err) {
    throw err;
  }
};
