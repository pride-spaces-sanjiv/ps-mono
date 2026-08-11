const linearSizes = ["3x2", "3.6x2", "4x2", "5x2"] as const;
const cubicleSizes = ["4x4", "5x4", "5x5"] as const;

export const workingSizes = [...linearSizes, ...cubicleSizes] as const;

export type WorkingSize = (typeof workingSizes)[number];
