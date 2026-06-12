import { Builder } from "@/database/models/builder.js";
import { ConventionalProperty } from "@/database/models/conventional.js";
import { Operator } from "@/database/models/operator.js";
import { Space } from "@/database/models/space.js";
import { builderSchema } from "@/database/schemas/builder.js";
import { conventionalPropertySchema } from "@/database/schemas/conventional.js";
import { operatorSchema } from "@/database/schemas/operator.js";
import { spaceSchema } from "@/database/schemas/space.js";

export const dumpCollectionNames = {
  SPACE: "spaces",
  OPERATOR: "operators",
  CONVENTIONAL: "conventionals",
  BUILDER: "builders",
} as const;

export type DumpCollectionName =
  (typeof dumpCollectionNames)[keyof typeof dumpCollectionNames];

// Collection Model
export const dumpCollectionModels = {
  spaces: Space,
  operators: Operator,
  conventionals: ConventionalProperty,
  builders: Builder,
} as const;
export type DumpCollectionModel =
  (typeof dumpCollectionModels)[keyof typeof dumpCollectionModels];

// Collection Schema
export const dumpCollectionSchemas = {
  spaces: spaceSchema,
  operators: operatorSchema,
  conventionals: conventionalPropertySchema,
  builders: builderSchema,
} as const;
export type DumpCollectionSchema =
  (typeof dumpCollectionSchemas)[keyof typeof dumpCollectionSchemas];

export const dumpActions = {
  ADD: "add",
  UPDATE: "update",
  REMOVE: "remove",
} as const;

export type DumpAction = (typeof dumpActions)[keyof typeof dumpActions];

export const dumpStatuses = {
  PENDING: "pending",
  RECORRECT: "recorrect",
  APPROVED: "approved",
} as const;

export type DumpStatus = (typeof dumpStatuses)[keyof typeof dumpStatuses];
