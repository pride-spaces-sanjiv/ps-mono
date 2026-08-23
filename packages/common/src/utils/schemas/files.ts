import { z } from "zod";
import { validate } from "uuid";

const uuidFileSchema = (message: string) =>
  z.string().refine(
    (filename) => {
      const [uuid] = filename.split(/\.[A-z0-9]+/);

      return z.uuidv7().safeParse(uuid).success;
    },
    { message },
  );

export const filesSchema = z.object({
  images: z.array(
    uuidFileSchema("Invalid image file id"),
    "Images must be array of image file ids",
  ),
  layouts: z.array(
    uuidFileSchema("Invalid layout file id"),
    "Layouts must be array of layout file ids",
  ),
});
