import * as yup from "yup";

export const parsePlaylistSchema = yup.object().shape({
  url: yup
    .string()
    .required("Playlist Url is required")
    .trim("Playlist Url cannot be empty")
    .url("Playlist Url must be a valid link"),
  headers: yup
    .object()
    .optional()
    .notRequired()
    .test(
      "invalid-object",
      "Headers must be a valid object",
      (val) => typeof val === "undefined" || (typeof val === "object" && !!val),
    )
    .test(
      "invalid-keys-found",
      "All keys must start with an alphabet",
      (obj) =>
        typeof obj === "object"
          ? Object.keys(obj as Record<string, any>).every((key) =>
              /^[A-z]+[0-9-A-z]*[A-z]*$/.test(key),
            )
          : true,
    )
    .test(
      "invalid-values-found",
      "All values must be string, number or boolean",
      (obj) =>
        typeof obj === "object"
          ? Object.values(obj as Record<string, any>).every(
              (val) =>
                typeof val === "string" ||
                (typeof val === "number" && Number.isFinite(val)) ||
                typeof val === "boolean",
            )
          : true,
    ),
});

export const compareChannelsValidFields = ["tvgId", "tvgName", "name"] as const;
export const compareChannelsByFieldsSchema = yup.object().shape({
  checkByField: yup.lazy((value) => {
    if (Array.isArray(value)) {
      return yup.array().of(yup.string().oneOf(compareChannelsValidFields));
    }
    return yup.string().oneOf(compareChannelsValidFields);
  }),
});

export type ParsePlaylistSchema = yup.InferType<typeof parsePlaylistSchema>;
export type CompareChannelsByFieldsSchema = yup.InferType<
  typeof compareChannelsByFieldsSchema
>;
