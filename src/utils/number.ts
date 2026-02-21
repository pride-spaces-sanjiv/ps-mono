export type ValidateOptions<I extends any = number> = {
  /** @default true */
  notNaN: boolean;
  /** @default true */
  finite: boolean;
  /** @default false */
  isInt: boolean;
  /** @default false */
  convertToInt: boolean;
  /** @default false */
  convertToFloat: boolean;
  /** @default NaN */
  invalidValue: I;
  customValidation: (val: number) => boolean;
};
const defaultOptions = {
  validateNumber: {
    notNaN: true,
    finite: true,
    invalidValue: NaN,
  } as Partial<ValidateOptions>,
};

export const validateNumber = <I extends any = number>(
  value: any,
  options?: Partial<ValidateOptions<I>>
): I | number => {
  const allOptions = { ...defaultOptions.validateNumber, ...options };
  const invalidValue = allOptions.invalidValue as I;
  try {
    const num = Number(String(value));
    if (allOptions.notNaN && Number.isNaN(num)) {
      return invalidValue;
    }
    if (allOptions.finite && !Number.isFinite(num)) {
      return invalidValue;
    }
    if (allOptions.isInt && !Number.isInteger(num)) {
      return invalidValue;
    }
    if (
      typeof allOptions.customValidation === "function" &&
      !allOptions.customValidation(num)
    ) {
      return invalidValue;
    }
    if (allOptions.convertToInt) {
      const res = Number.parseInt(String(num));
      return res;
    }
    if (allOptions.convertToFloat) {
      const res = Number.parseFloat(String(num));
      return res;
    }
    return num;
  } catch (err) {
    return invalidValue;
  }
};

export const isInteger = <I extends any = number>(
  value: any,
  options?: Partial<ValidateOptions<I>>
) => {
  const result = validateNumber(value, { isInt: true, ...options });
  return Number.isInteger(result);
};
