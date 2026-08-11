import { ResponseHandler } from "@/middlewares/request.js";
import { Amenity, amenityFields } from "@/database/models/amenities.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getSearchFilters,
} from "@/utils/mongoose/filters.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { cleanObject } from "@/utils/object/clean.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { AmenitySchema } from "@/database/schemas/amenity.js";

export const getAmenities = async (
  req: ManagedRequest<any>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      Amenity,
      amenityFields,
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
        projection: projectors,
        filter: cleanObject({ ...searchFilters }, { excludeByValues: [""] }),
      },
    );

    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-amenities-error",
        message: "Failed to get amenities",
      });
      return;
    }

    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "amenities-not-found",
        message: "No amenities found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });

    ResponseHandler.handleSuccess(res, {
      message: "Got amenities list",
      data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-amenities-error-failure",
      message: "Failed to get amenities",
    });
  }
};

//  GET SINGLE Amenities
export const getAmenity = async (req: ManagedRequest, res: ManagedResponse) => {
  try {
    const { projectors } = getFieldsandProjectors(req, Amenity, amenityFields);

    const doc = await Amenity.findOne({ _id: req.params.id }, projectors);
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "amenity-not-found",
        message: "Amenities not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-amenity-error-failure",
      message: "Failed to get amenity",
    });
  }
};

//  CREATE Amenities
export const createAmenity = async (
  req: ManagedRequest<AmenitySchema>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;

    const doc = new Amenity(body);
    await doc.save();

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Created amenity successfully",
      data,
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "amenity-unique-error",
        msgPre: "Amenities",
      },
    });

    if (errorData.handled) return;

    ResponseHandler.handleError(res, {
      errorType: "create-amenity-error-failure",
      message: "Failed to create amenity",
    });
  }
};

//  UPDATE Amenities
export const updateAmenity = async (
  req: ManagedRequest<Partial<AmenitySchema>>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;

    const doc = await Amenity.findOneAndUpdate({ _id: req.params.id }, body, {
      new: true,
    });

    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "amenity-not-found",
        message: "Amenities not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      data,
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "amenity-unique-error",
        msgPre: "Amenities",
      },
    });

    if (errorData.handled) return;

    ResponseHandler.handleError(res, {
      errorType: "update-amenity-error-failure",
      message: "Failed to update amenity",
    });
  }
};

//  DELETE Amenities
export const deleteAmenity = async (
  req: ManagedRequest,
  res: ManagedResponse,
) => {
  try {
    const doc = await Amenity.findOneAndDelete({
      _id: req.params.id,
    });

    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "amenity-not-found",
        message: "Amenities not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      data: { id: data?.id },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-amenity-error-failure",
      message: "Failed to delete amenity",
    });
  }
};
