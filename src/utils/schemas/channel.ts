import * as yup from "yup";

export const keyTypes = ["clearkey", "widevine"] as const;
export const streamTypes = ["mpd", "m3u8", "ts"] as const;
export type KeyType = (typeof keyTypes)[number];
export type StreamType = (typeof streamTypes)[number];

export const channelSchema = yup.object().shape({
  name: yup
    .string()
    .required("Group Name is required")
    .trim("Group Name cannot be empty")
    .min(4, "Minimum 4 letters required"),
  tvgLogo: yup
    .string()
    .required("Tvg Logo is required")
    .trim("Tvg Logo cannot be empty"),
  tvgId: yup
    .string()
    .required("Tvg Id is required")
    .trim("Tvg Id cannot be empty"),
  groupId: yup
    .string()
    .required("Group is required")
    .trim("Group cannot be empty"),
  keyType: yup
    .string()
    .optional()
    .notRequired()
    .oneOf(keyTypes, "Key Type must be one of [clearkey, widevine]"),
  streamType: yup
    .string()
    .optional()
    .notRequired()
    .oneOf(streamTypes, "Stream Type must be one of [MPD, M3U8, TS]"),
  enabled: yup.boolean().required("Status is required"),
});
export type ChannelSchema = yup.InferType<typeof channelSchema>;

export const addChannelSchema = channelSchema.concat(
  yup.object().shape({
    provider: yup
      .number()
      .required("Provider is required")
      .integer("Provider is invalid")
      .min(1, "Provider must be atleast 1"),
    streamUrl: yup
      .string()
      .required("Stream URL is required")
      .trim("Stream URL cannot be empty")
      .url("Stream URL is invalid"),
  }),
);
export type AddChannelSchema = yup.InferType<typeof addChannelSchema>;
