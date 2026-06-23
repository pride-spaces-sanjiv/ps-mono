import { z } from "zod";

export const filesSchema = z.object({
  images: z.array(
    z.uuidv7("Invalid image file id"),
    "Images must be array of image file ids",
  ),
  layouts: z.array(
    z.uuidv7("Invalid layout file id"),
    "Layouts must be array of layout file ids",
  ),
});
