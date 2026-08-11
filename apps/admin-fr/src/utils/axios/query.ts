const validTypes = ["string", "number", "boolean", "object"];

/**
 * @description Returns string of query with `?` if any query param
 * @description Returns empty string if no query param
 * @description Takes object data accepting `string`, `number` or `boolean` or even array of these types
 */
export const queryToString = <
  T extends {
    [k: string]: string | number | boolean | (string | number | boolean)[];
  }
>(
  query: T | undefined | null
) => {
  const search = new URLSearchParams();
  for (const key in query) {
    const val = query[key];

    // Skips invalid types
    if (
      !validTypes.includes(typeof val) ||
      (typeof val === "number" && !Number.isFinite(val)) ||
      (typeof val === "object" && !Array.isArray(val))
    ) {
      continue;
    }

    if (Array.isArray(val)) {
      val
        .filter((v) => validTypes.includes(typeof v))
        .map((v) => search.append(key, String(v)));
      continue;
    }
    search.set(key, String(val));
  }
  return ("?" + search.toString()).replace(/\?+$/, "");
};
