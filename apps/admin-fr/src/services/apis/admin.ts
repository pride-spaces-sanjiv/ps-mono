import { BASE } from "./config";
// import {
//   passwordUserChangeSchema,
//   type PasswordUserChangeSchema,
// } from "@/utils/schemas/user";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { User } from "@/types/data/user";

type PasswordRes = GeneralResponseWithError<{
  id: string;
  password: string | null | undefined;
}>;
type UpdatePasswordRes = GeneralResponseWithError<{
  id: string;
  oldPassword: string | null | undefined;
  newPassword: string | null | undefined;
}>;

export const getUserPassword = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.get<PasswordRes>(url, config);
    return res;
  },
});

export const updateUserPassword = APIBodyValidationWrapper({
  // schema: passwordUserChangeSchema.pick(["password"]),
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.put<UpdatePasswordRes>(url, param?.body, config);
    return res;
  },
});
