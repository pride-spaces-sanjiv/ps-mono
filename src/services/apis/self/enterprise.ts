import { ENTERPRISE } from "../config";
import {
  enterpriseSchema,
  type EnterpriseSchema,
} from "@/utils/schemas/enterprise";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type { GeneralResponseWithError } from "@/types/axios/response";

type GetRes = GeneralResponseWithError<Omit<
  EnterpriseSchema,
  "password"
> | null>;

export const getSelfData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await ENTERPRISE.get<GetRes>("/", config);
    return res;
  },
});
export const updateSelfData = APIBodyValidationWrapper({
  schema: enterpriseSchema.omit({ password: true }),
  handle: async (param, config) => {
    const res = await ENTERPRISE.post<GetRes>("/", param?.body, config);
    return res;
  },
});
