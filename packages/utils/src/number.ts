export function validateNumber(
  val: unknown,
  options?: { invalidValue?: number }
): number {
  const fallback = options?.invalidValue ?? 0;
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}
