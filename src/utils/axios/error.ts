import { isAxiosError, type AxiosResponse } from "axios";

type AxiosErrorHandle<R extends any> = {
  status?: number;
  /**
   * @description Normal handler that executes if status is matched
   * @description Finishes main execution if this exists
   */
  handler?: (res: AxiosResponse<R> | undefined | null) => any;
  /**
   * @description The custom handler of response, overrides normal handler
   * @description If returns `true` will finish main execution and return the same
   */
  customHandler?: (res: AxiosResponse<R> | undefined | null) => boolean;
};

/**
 * @description Handles cases based on `response` and/or `status-code`
 */
export const handleAxiosErrorCases = <R extends any>(
  err: any,
  casedHandlers: AxiosErrorHandle<R>[]
) => {
  try {
    if (!isAxiosError(err)) {
      throw new Error("Not an axios error");
    }
    const res = err.response;
    for (let i = 0; i < casedHandlers.length; i++) {
      const caseHandle = casedHandlers[i];
      if (typeof caseHandle.customHandler === "function") {
        const handled = caseHandle.customHandler(res);
        if (handled) {
          return true;
        }
      }
      if (
        typeof caseHandle.status === "number" &&
        Number.isFinite(caseHandle.status) &&
        res?.status === caseHandle.status
      ) {
        const handler = caseHandle.handler;
        if (typeof handler === "function") {
          handler(res);
          return true;
        }
      }
    }
    throw new Error("Nothing got lastly");
  } catch (err) {
    return false;
  }
};
