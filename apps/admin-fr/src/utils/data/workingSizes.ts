const linearSizes = ["3x2", "3.6x2", "4x2", "5x2"] as const;
const cubicleSizes = ["4x4", "5x4", "5x5"] as const;

export const workingSizes = [...linearSizes, ...cubicleSizes] as const;

export type WorkingSize = (typeof workingSizes)[number];

export const getDenotedWorkingSize = (size: WorkingSize) => {
  return size.replace(/[0-9]+[.]?[0-9]*/g, (match) => match.concat("'"));
};

const getWorkingSizeLabel = (size: WorkingSize, isLinear: boolean) => {
  size = getDenotedWorkingSize(size) as WorkingSize;
  if (isLinear) {
    return `${size} - Linear Workstation`;
  }
  return `${size} - Cubicle Workstation`;
};

export const labelledWorkingSizes = linearSizes
  .map(
    (size) =>
      ({
        label: getWorkingSizeLabel(size, true),
        value: size,
      }) as { label: string; value: WorkingSize },
  )
  .concat(
    cubicleSizes.map((size) => ({
      label: getWorkingSizeLabel(size, false),
      value: size,
    })),
  );
