import type { UploadedFile } from "@/components/form/file-upload";
import { useMemo, useState } from "react";

type Params<K extends string> = {
  names: [...(readonly K[])];
};
export const useMappedFilesState = <K extends string>({
  names = [],
}: Partial<Params<K>>) => {
  const mappedStates = useMemo(
    () =>
      Object.fromEntries(
        names.map((name) => [name, useState<UploadedFile[]>([])]),
      ) as Record<
        K,
        [UploadedFile[], React.Dispatch<React.SetStateAction<UploadedFile[]>>]
      >,
    [names],
  );
  return mappedStates;
};
