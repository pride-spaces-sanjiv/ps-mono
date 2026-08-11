import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { GENERAL_LOCATION } from "../config";
import type { GeneralResponseWithError } from "@/types/axios/response";
import { locationSchema } from "@/utils/schemas/location";

export type MapsURLPosRes = GeneralResponseWithError<
  Partial<{ lat: number; lng: number; url: string; redirectUrl: string }>
>;

export const getMapsURLPos = APIBodyValidationWrapper({
  schema: locationSchema.pick({ url: true }).partial(),
  handle: async (param, config) => {
    const res = await GENERAL_LOCATION.post<MapsURLPosRes>(
      "/maps-url/position",
      param?.body,
    );
    return res;
  },
});
