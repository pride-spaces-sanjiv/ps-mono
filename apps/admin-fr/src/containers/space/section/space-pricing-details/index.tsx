import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import {
  spaceSchema,
  type SpaceSchema,
} from "@pride-spaces/common/utils/schemas/space.js";

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
  isMos: boolean;
  pricingChangesAllData: ChangedAllData;
  changedFieldProps: ChangedFieldPropsFn;
  autoSave: AutoSaveFn;
};

export default function SpacePricingDetailsSection({
  formProps,
  isMos = false,
  pricingChangesAllData,
  changedFieldProps,
  autoSave,
}: Partial<Props>) {
  const {
    register,
    watch,
    setValue,
    formState: { errors } = {},
  } = formProps || ({} as SpaceFormProps);

  return (
    <>
      {/* Pricing Details */}
      <FormSectionTitle>Pricing Details</FormSectionTitle>
      <FormField
        label="Per Seat"
        labelPosition="embedded"
        placeholder="300"
        type="number"
        inputMode="decimal"
        min={0}
        max={99999}
        {...register?.("pricing.perSeat", {
          valueAsNumber: true,
        })}
        error={errors?.pricing?.perSeat}
        {...changedFieldProps?.(pricingChangesAllData, "perSeat")}
      />
      {!isMos && (
        <>
          <FormField
            label="Meeting Room"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...register?.("pricing.meetingRoom", {
              valueAsNumber: true,
            })}
            error={errors?.pricing?.meetingRoom}
          />
          <FormField
            label="Dedicated Desk"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...register?.("pricing.dedicatedDesk", {
              valueAsNumber: true,
            })}
            error={errors?.pricing?.dedicatedDesk}
            {...changedFieldProps?.(pricingChangesAllData, "dedicatedDesk")}
          />
          <FormField
            label="Day Pass"
            labelPosition="embedded"
            placeholder="300"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...register?.("pricing.dayPass", {
              valueAsNumber: true,
            })}
            error={errors?.pricing?.dayPass}
            {...changedFieldProps?.(pricingChangesAllData, "dayPass")}
          />
          <FormField
            label="Flexi/Hot Desk"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...register?.("pricing.flexiDesk", {
              valueAsNumber: true,
            })}
            error={errors?.pricing?.flexiDesk}
          />
          <FormField
            key={`vo-service-${watch?.("flags.isVoService")}`}
            label="VO Service"
            labelPosition="embedded"
            inputType="select"
            items={[
              { label: "YES", value: "true" },
              { label: "NO", value: "false" },
            ]}
            error={errors?.flags?.isVoService}
            pickerProps={{
              wrapperProps: {
                value: watch?.("flags.isVoService") ? "true" : "false",
                onValueChange: (val) => {
                  const isYes = val === "true";
                  setValue?.("flags.isVoService", isYes, {
                    shouldValidate: true,
                  });
                  if (!isYes) {
                    setValue?.("pricing.vo", 0, { shouldValidate: true });
                  }
                  autoSave?.();
                },
              },
            }}
          />
          {watch?.("flags.isVoService") && (
            <FormField
              label="VO P/M"
              labelPosition="embedded"
              placeholder="3000"
              type="number"
              inputMode="decimal"
              min={0}
              max={99999}
              {...register?.("pricing.vo", {
                valueAsNumber: true,
              })}
              error={errors?.pricing?.vo}
            />
          )}
        </>
      )}
    </>
  );
}