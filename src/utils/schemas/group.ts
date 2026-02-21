import * as yup from "yup";

export const groupSchema = yup.object().shape({
  name: yup
    .string()
    .required("Group Name is required")
    .trim("Group Name cannot be empty")
    .min(4, "Minimum 4 letters required"),
  referenceGroup: yup
    .string()
    .required("Reference group is required")
    .trim("Reference group cannot be empty"),
});
export type GroupSchema = yup.InferType<typeof groupSchema>;
