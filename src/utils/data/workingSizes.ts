export const workingSizes = ["900x600", "1050x600", "1200x600"] as const;

export type WorkingSize = (typeof workingSizes)[number];
