import type { UploadedFile } from "@/components/form/file-upload";
import { useState } from "react";

type Params<K extends string> = {
  names: [...(readonly K[])];
};
export const useMappedFilesState = <K extends string>({
  names = [],
}: Partial<Params<K>>) => {
  const [states, setStates] = useState(() =>
    Object.fromEntries(names.map((name) => [name, [] as UploadedFile[]])) as Record<K, UploadedFile[]>
  );

  const mappedStates = Object.fromEntries(
    names.map((name) => {
      const value = states[name] || [];
      const setter = (
        action: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])
      ) => {
        setStates((prev) => {
          const prevVal = prev[name] || [];
          const nextVal = typeof action === "function" ? (action as any)(prevVal) : action;
          return {
            ...prev,
            [name]: nextVal,
          };
        });
      };
      return [name, [value, setter]];
    })
  ) as Record<
    K,
    [UploadedFile[], React.Dispatch<React.SetStateAction<UploadedFile[]>>]
  >;

  return mappedStates;
};
