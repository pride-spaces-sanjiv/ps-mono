import type { BranchSchema } from "@/utils/schemas/operators";

export const setSinglePrimaryBranch = (
  branches: BranchSchema[],
  newBranch?: BranchSchema,
) => {
  const newIsPrimary = newBranch?.isPrimary;
  const branchExistingInd = newBranch
    ? branches.findIndex((br) => br.code === newBranch?.code)
    : -1;
  const modifiedBranches =
    branchExistingInd >= 0 && newBranch
      ? branches.map((br, i) =>
          i === branchExistingInd ? newBranch : { ...br, isPrimary: false },
        )
      : [...branches, newBranch].filter((v): v is BranchSchema => !!v);

  //  Set first one as primary if no found
  if (!modifiedBranches.some((br) => br.isPrimary) && modifiedBranches.length) {
    modifiedBranches[0] = { ...modifiedBranches[0], isPrimary: true };
  }

  return newIsPrimary
    ? modifiedBranches.map((dt, i, self) => ({
        ...dt,
        isPrimary: i === self.length - 1,
      }))
    : modifiedBranches;
};
