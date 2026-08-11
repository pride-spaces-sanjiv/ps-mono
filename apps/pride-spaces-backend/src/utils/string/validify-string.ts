export const invalidValues = ["n/a", "na", "n-a"] as const;

type Options<T extends any = ""> = {
  postInvalidValue: T;
  invalidateNonString: boolean;
};
export const validifyStringValues = <T extends any, I = "">(
  value?: T,
  {
    // @ts-ignore
    postInvalidValue = "",
    invalidateNonString = true,
  }: Partial<Options<I>> = {},
) => {
  if (typeof value === "string") {
    if (
      invalidValues.includes(
        value
          .toLowerCase()
          .trim()
          .replace(/[^A-z0-9]+/g, "") as (typeof invalidValues)[number],
      )
    ) {
      return postInvalidValue;
    }
    return value;
  }
  return postInvalidValue;
};
