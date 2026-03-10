import { ADMIN_OPERATOR } from "../config";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";

import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";

// import type { Operator } from "@/types/data/operators";
import { operatorSchema } from "@/utils/schemas/operators";
import type { Operator } from "@/types/data/operators";

type OperatorsRes = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: Operator[];
      references: Record<
        string,
        Partial<{ results: any[]; metrics: { total: number } }>
      >;
    }>
  >
>;

// 🔹 Get All Operators (Paginated)
export const getOperators = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");

    const res = await ADMIN_OPERATOR.get<OperatorsRes>(url, config);
    return res;
  },
});

// 🔹 Get Single Operator
export const getOperatorById = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");

    const res = await ADMIN_OPERATOR.get<
      GeneralResponseWithError<Operator>
    >(url, config);

    return res;
  },
});

// 🔹 Create Operator
export const createOperator = APIBodyValidationWrapper({
  schema: operatorSchema,
  handle: async (param, config) => {
    const url = "/";

    const res = await ADMIN_OPERATOR.post<
      GeneralResponseWithError<Operator>
    >(url, param?.body, config);

    return res;
  },
});

// 🔹 Update Operator
export const updateOperator = APIBodyValidationWrapper({
  schema: operatorSchema.partial(),
  handle: async (param, config) => {
    const url = `/${param?.url}`;

    const res = await ADMIN_OPERATOR.put<
      GeneralResponseWithError<Operator>
    >(url, param?.body, config);

    return res;
  },
});

// 🔹 Delete Operator
export const deleteOperator = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");

    const res = await ADMIN_OPERATOR.delete<
      GeneralResponseWithError<Pick<Operator, "id">>
    >(url, config);

    return res;
  },
});