import { ResponseHandler } from "@/middlewares/request.js";
import {
  City,
  cityFields,
  State,
  stateFields,
} from "@pride-spaces/backend/database/models/state-cities.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@pride-spaces/backend/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getSearchFilters,
} from "@pride-spaces/backend/utils/mongoose/filters.js";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";
import { cleanObject } from "@pride-spaces/common/utils/object/clean.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";

export const getCities = async (
  req: ManagedRequest<any>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      City,
      cityFields,
    );

    const searchFilters = getSearchFilters<typeof City>(req, {
      fieldMaps: {
        Name: "name",
        State: "state",
      },
    });

    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      City,
      cityFields,
      { limit: 10 },
      {
        projection: projectors,
        filter: cleanObject({ ...searchFilters }, { excludeByValues: [""] }),
      },
    );

    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-cities-error",
        message: "Failed to get cities",
      });
      return;
    }

    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "cities-not-found",
        message: "No cities found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });

    ResponseHandler.handleSuccess(res, {
      message: "Got cities list",
      data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-cities-error-failure",
      message: "Failed to get cities",
    });
  }
};

//  GET SINGLE City
export const getCity = async (req: ManagedRequest, res: ManagedResponse) => {
  try {
    const { projectors } = getFieldsandProjectors(req, City, cityFields);

    const doc = await City.findOne({ _id: req.params.id }, projectors);
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "city-not-found",
        message: "City not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-city-error-failure",
      message: "Failed to get city",
    });
  }
};
