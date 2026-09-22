import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  type SpaceSchema,
  spaceSchema,
} from "@pride-spaces/common/utils/schemas/space.js";

export type SpaceFormProps = UseFormReturn<
  z.input<typeof spaceSchema>,
  unknown,
  SpaceSchema
>;
