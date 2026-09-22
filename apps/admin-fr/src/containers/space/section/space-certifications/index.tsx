import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { GroupedSearchSelect } from "@/components/search-select";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import ChippedElements from "@/components/chips";
import ActionButton from "@/components/buttons/action-btn";
import {
  certificates,
  type Certificate,
} from "@pride-spaces/common/utils/data/certificates.js";
import {
  labelledSpaceGrades,
} from "@/utils/data/spaceTypes";
import {
  spaceSchema,
  type SpaceSchema,
} from "@pride-spaces/common/utils/schemas/space.js";

const ocStatusOptions = [
  { label: "OC", value: "OC" },
  { label: "NON OC", value: "NON OC" },
  { label: "!", value: "!" },
];

const sezStatusOptions = [
  { label: "SEZ", value: "SEZ" },
  { label: "NON SEZ", value: "NON SEZ" },
  { label: "!", value: "!" },
];

type SpaceFormProps = UseFormReturn<
  z.input<typeof spaceSchema>,
  unknown,
  SpaceSchema
>;
type ChangedAllData = Record<string, any> | null | undefined;
type ChangedFieldPropsFn = (
  data: Record<string, unknown> | null | undefined,
  field: string,
) => { embeddedWrapperProps?: { className?: string } };
type AutoSaveFn = () => void;

type Props = {
  formProps: SpaceFormProps;
  mainChangesAllData: ChangedAllData;
  changedFieldProps: ChangedFieldPropsFn;
  autoSave: AutoSaveFn;
};

export default function SpaceCertificationsSection({
  formProps,
  mainChangesAllData,
  changedFieldProps,
  autoSave,
}: Partial<Props>) {
  const {
    watch,
    setValue,
    formState: { errors, defaultValues } = {},
  } = formProps || ({} as SpaceFormProps);

  return (
    <>
      {/* SECTION: Certifications */}
      <FormSectionTitle>Certifications</FormSectionTitle>

      {/* Building Type */}
      <FormField
        key={`space-grade-${defaultValues?.specs?.grade}`}
        label="Building Type"
        labelPosition="embedded"
        inputType="select"
        items={labelledSpaceGrades}
        error={errors?.specs?.grade}
        pickerProps={{
          wrapperProps: {
            defaultValue: defaultValues?.specs?.grade,
            onValueChange: (val) => {
              setValue?.(
                "specs.grade",
                val as SpaceSchema["specs"]["grade"],
                {
                  shouldValidate: true,
                },
              );
              autoSave?.();
            },
          },
        }}
        {...changedFieldProps?.(mainChangesAllData, "grade")}
      />

      {/* OC Status */}
      <FormField
        key={`oc-status-${watch?.("flags.isOc")}`}
        label="OC Status"
        labelPosition="embedded"
        inputType="select"
        items={ocStatusOptions}
        error={errors?.flags?.isOc}
        pickerProps={{
          wrapperProps: {
            defaultValue:
              typeof defaultValues?.flags?.isOc === "string"
                ? defaultValues.flags.isOc
                : defaultValues?.flags?.isOc
                  ? "OC"
                  : "!",
            onValueChange: (val) => {
              setValue?.("flags.isOc", val as string, {
                shouldValidate: true,
              });
              autoSave?.();
            },
          },
        }}
        {...changedFieldProps?.(mainChangesAllData, "isOc")}
      />

      {/* SEZ Status */}
      <FormField
        key={`sez-status-${watch?.("flags.isSez")}`}
        label="SEZ Status"
        labelPosition="embedded"
        inputType="select"
        items={sezStatusOptions}
        error={errors?.flags?.isSez}
        pickerProps={{
          wrapperProps: {
            defaultValue:
              typeof defaultValues?.flags?.isSez === "string"
                ? defaultValues.flags.isSez
                : defaultValues?.flags?.isSez
                  ? "SEZ"
                  : "!",
            onValueChange: (val) => {
              setValue?.("flags.isSez", val as string, {
                shouldValidate: true,
              });
              autoSave?.();
            },
          },
        }}
        {...changedFieldProps?.(mainChangesAllData, "isSez")}
      />

      {/* Other Certifications */}
      <FormField
        label="Other Certifications"
        labelPosition="embedded"
        error={{
          message:
            errors?.specs?.certificates?.[0]?.message ||
            errors?.specs?.certificates?.message,
          type:
            errors?.specs?.certificates?.[0]?.type ||
            errors?.specs?.certificates?.type ||
            "validate",
        }}
        {...changedFieldProps?.(mainChangesAllData, "certificates")}
      >
        <GroupedSearchSelect
          key={`certificates-${defaultValues?.specs?.certificates?.length}`}
          type="multiple"
          showSearch={false}
          defaultSelected={defaultValues?.specs?.certificates}
          items={certificates.map((crt) => ({ label: crt, value: crt }))}
          triggerProps={{
            children: (
              <ActionButton
                type="button"
                variant={"outline"}
                className={
                  "min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto"
                }
              >
                {(watch?.("specs.certificates", [])?.length || 0) > 0 ? (
                  <ChippedElements
                    elements={watch?.("specs.certificates", [])}
                  />
                ) : (
                  "Select Certifications"
                )}
              </ActionButton>
            ),
          }}
          contentProps={{ className: "max-h-[300px]" }}
          onSelect={(items) => {
            setValue?.(
              "specs.certificates",
              items.filter(
                (val) => typeof val === "string",
              ) as Certificate[],
              { shouldValidate: true },
            );
            autoSave?.();
          }}
        />
      </FormField>
    </>
  );
}