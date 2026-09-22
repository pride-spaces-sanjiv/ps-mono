import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import ChippedElements from "@/components/chips";
import SelectAmenities from "@/containers/amenities/select-dialog";
import { useAmenities } from "@/services/hooks/useAmenities";
import {
  spaceSchema,
  type SpaceSchema,
} from "@pride-spaces/common/utils/schemas/space.js";
import type { SpaceFormProps } from "@/types/form/space";

type ChangedAllData = Record<string, any> | null | undefined;
type ChangedFieldPropsFn = (
  data: Record<string, unknown> | null | undefined,
  field: string,
) => { embeddedWrapperProps?: { className?: string } };
type AutoSaveFn = () => void;

type Props = {
  formProps: SpaceFormProps;
  mainChangesAllData: ChangedAllData;
  pricingChangesAllData: ChangedAllData;
  changedFieldProps: ChangedFieldPropsFn;
  autoSave: AutoSaveFn;
};

export default function SpaceAmenitiesSection({
  formProps,
  mainChangesAllData,
  pricingChangesAllData,
  changedFieldProps,
  autoSave,
}: Partial<Props>) {
  const { amenitiesData } = useAmenities();

  const {
    register,
    watch,
    setValue,
    formState: { errors, defaultValues } = {},
  } = formProps || ({} as SpaceFormProps);

  return (
    <>
      {/* SECTION: Amenities & Event Space Details */}
      <FormSectionTitle>Amenities & Event Space Details</FormSectionTitle>

      {/* Amenities */}
      <FormField
        label="Amenities"
        labelPosition="embedded"
        error={{
          message:
            errors?.facilities?.[0]?.message || errors?.facilities?.message,
          type:
            errors?.facilities?.[0]?.type ||
            errors?.facilities?.type ||
            "validate",
        }}
        {...changedFieldProps?.(mainChangesAllData, "facilities")}
      >
        <SelectAmenities
          className="grow-1 shrink-1 w-[200px] overflow-hidden overflow-x-auto justify-start"
          defaultAmenities={watch?.("facilities", [])}
          onSelect={(amenities) => {
            console.log(amenities);
            setValue?.(
              "facilities",
              // @ts-ignore
              amenities.map((a) => a.id),
              { shouldValidate: true },
            );
            autoSave?.();
          }}
        >
          {(watch?.("facilities", [])?.length || 0) > 0 ? (
            <ChippedElements
              className=""
              elements={amenitiesData
                .filter((dt) => watch?.("facilities", [])?.includes(dt.id))
                .map((dt) => dt.name)}
            />
          ) : (
            "Select Amenities"
          )}
        </SelectAmenities>
      </FormField>

      <FormField
        key={`event-space-${watch?.("flags.isEventSpace")}`}
        label="Event Space"
        labelPosition="embedded"
        inputType="select"
        items={[
          { label: "YES", value: "true" },
          { label: "NO", value: "false" },
        ]}
        error={errors?.flags?.isEventSpace}
        pickerProps={{
          wrapperProps: {
            value: watch?.("flags.isEventSpace") ? "true" : "false",
            onValueChange: (val) => {
              const isYes = val === "true";
              setValue?.("flags.isEventSpace", isYes, {
                shouldValidate: true,
              });
              if (!isYes) {
                setValue?.("pricing.eventSpaceBrief", "", {
                  shouldValidate: true,
                });
                setValue?.("pricing.eventSpaceCharges", "", {
                  shouldValidate: true,
                });
                setValue?.("pricing.eventSpaceCapacity", undefined, {
                  shouldValidate: true,
                });
              }
              autoSave?.();
            },
          },
        }}
      />

      {watch?.("flags.isEventSpace") && (
        <>
          <div className="col-span-full flex flex-col gap-1">
            <FormField
              label="Event Space Brief"
              labelPosition="embedded"
              placeholder="Brief description of the event space..."
              inputType="textarea"
              required
              {...register?.("pricing.eventSpaceBrief")}
              error={errors?.pricing?.eventSpaceBrief}
            />
            <div className="flex justify-end text-xs text-muted-foreground px-1">
              <span>
                {
                  (watch?.("pricing.eventSpaceBrief") || "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length
                }
                /200 words
              </span>
            </div>
          </div>
          <FormField
            label="Event Space Capacity"
            labelPosition="embedded"
            placeholder="e.g. 50"
            type="number"
            inputMode="numeric"
            min={0}
            required
            {...register?.("pricing.eventSpaceCapacity", {
              valueAsNumber: true,
            })}
            error={errors?.pricing?.eventSpaceCapacity}
            {...changedFieldProps?.(
              pricingChangesAllData,
              "eventSpaceCapacity",
            )}
          />
          <FormField
            label="Event Space Charges"
            labelPosition="embedded"
            placeholder="e.g. ₹5,000 / hour"
            required
            {...register?.("pricing.eventSpaceCharges")}
            error={errors?.pricing?.eventSpaceCharges}
          />
        </>
      )}
    </>
  );
}