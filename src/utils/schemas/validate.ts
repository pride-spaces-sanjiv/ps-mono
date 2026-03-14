import { z } from "zod";
import {
  ResponseHandler,
  extractOnlySchemaKeys,
} from "@/middlewares/request.js";
import { ManagedResponse } from "@/types/request.js";

export const validateDataAndRespond = <
  T extends z.core.$ZodLooseShape,
  D extends any = any,
>(
  schema: T,
  data: D,
  res: ManagedResponse,
  options: Partial<{
    allowEmpty: boolean;
    validateOnlyPresent: boolean;
    overridePostValidation: boolean;
    extractOnlyRequiredFields: boolean;
    keyName: string;
    keyNameFull: string;
  }> = {},
) => {
  const result = {
    error: null as Error | null,
    handled: false,
    valid: false,
    parsed: data,
  };
  const { keyNameFull = "Data", keyName = "data" } = options;
  try {
    if (!options?.allowEmpty) {
      if (typeof data !== "object" || Array.isArray(data)) {
        ResponseHandler.handleError(res, {
          message: `${keyNameFull} is invalid`,
          errorType: `${keyName}-invalid`,
        });
        result.handled = true;
        return result;
      }
      if (!data || !Object.keys(data).length) {
        ResponseHandler.handleError(res, {
          message: `${keyNameFull} is empty`,
          errorType: `${keyName}-empty`,
        });
        result.handled = true;
        return result;
      }
    }

    if (options?.validateOnlyPresent) {
      for (const key in data) {
        // @ts-ignore
        if (schema.shape[key]) {
          // @ts-ignore
          const validated = schema.shape[key].parse(data[key]);
          if (options?.overridePostValidation) {
            // @ts-ignore
            data[key] = validated;
          }
        }
      }
      if (options?.extractOnlyRequiredFields) {
        data = extractOnlySchemaKeys(
          data as any,
          // @ts-ignore
          schema,
        ) as typeof data;
      }
      result.valid = true;
      result.parsed = data;
      return result;
    }
    // @ts-ignore
    const validated = schema.parse(data);
    if (options?.overridePostValidation) {
      data = validated;
    }
    if (options?.extractOnlyRequiredFields) {
      data = extractOnlySchemaKeys(
        data as any,
        // @ts-ignore
        schema,
      ) as typeof data;
    }
    result.valid = true;
    result.parsed = data;
    return result;
  } catch (err: any) {
    result.error = err;
    if (err instanceof z.ZodError) {
      ResponseHandler.handleError(res, {
        message: err.message,
        errorType: "body-validation",
        appendData: {
          validationError: true,
          error: err.message,
          field: err.issues[0]?.path?.join(".") || "unknown",
          errors: err.issues.map((e) => {
            // @ts-ignore
            delete e.input;
            return e;
          }),
          fields: err.issues.map((e) => e.path.join(".")),
        },
      });
      result.handled = true;
      return result;
    }
    return result;
  }
};
