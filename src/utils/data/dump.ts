export const dumpCollectionNames = {
  SPACE: "spaces",
  OPERATOR: "operators",
} as const;

export type DumpCollectionName =
  (typeof dumpCollectionNames)[keyof typeof dumpCollectionNames];

export const dumpActions = {
  ADD: "add",
  UPDATE: "update",
  REMOVE: "remove",
} as const;

export type DumpAction = (typeof dumpActions)[keyof typeof dumpActions];
