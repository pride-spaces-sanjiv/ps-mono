import { ENTERPRISE } from "../config";
import {
  operatorSchema,
  type OperatorSchema,
} from "@/utils/schemas/operators";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type { GeneralResponseWithError } from "@/types/axios/response";

type GetRes = GeneralResponseWithError<Omit<
  OperatorSchema,
  "password"
> | null>;

export const getSelfData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await ENTERPRISE.get<GetRes>("/", config);
    return res;
  },
});
export const updateSelfData = APIBodyValidationWrapper({
  schema: operatorSchema.omit({ password: true }),
  handle: async (param, config) => {
    const res = await ENTERPRISE.post<GetRes>("/", param?.body, config);
    return res;
  },
});
