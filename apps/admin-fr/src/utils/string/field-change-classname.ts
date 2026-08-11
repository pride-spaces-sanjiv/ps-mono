import { cn } from "@/utils/cn";
import type { ClassValue } from "clsx";

export const highlightFieldClassName = <
  T extends Record<string, any> = Record<string, any>,
>(
  data: T | null | undefined,
  fieldName: keyof T,
  ...inputs: ClassValue[]
) => {
  try {
    if (!data) {
      throw new Error("Invalid data");
    }
    if (Object.keys(data).includes(fieldName as string)) {
      return cn(
        ...inputs,
        "border-amber-400/50 bg-amber-500/10 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]",
      );
    }
    throw new Error("Field was unchanged");
  } catch (err) {
    return cn(...inputs);
  }
};
