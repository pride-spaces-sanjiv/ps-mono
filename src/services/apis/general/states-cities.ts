import { CITIES, STATES } from "../config";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
// types
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { State, City } from "@/types/data/states-cities";

type StatesRes = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: State[];
    }>
  >
>;

type CitiesRes = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: City[];
    }>
  >
>;

// 🔹 Get All (Paginated)
export const getStates = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await STATES.get<StatesRes>(url, config);
    return res;
  },
});

export const getCities = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");
    const res = await CITIES.get<CitiesRes>(url, config);
    return res;
  },
});
