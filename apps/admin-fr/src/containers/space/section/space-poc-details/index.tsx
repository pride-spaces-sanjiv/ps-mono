import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
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
  pocSameAsOperator: boolean;
  setPOCSameAsOperator: (checked: boolean) => void;
  personChangesAllData: ChangedAllData;
  changedFieldProps: ChangedFieldPropsFn;
  autoSave: AutoSaveFn;
  revertAllFormFields: () => void;
  activeInputHasPressedEnter: { current: Record<string, boolean> };
};

export default function SpacePocDetailsSection({
  formProps,
  pocSameAsOperator = false,
  setPOCSameAsOperator,
  personChangesAllData,
  changedFieldProps,
  autoSave,
  revertAllFormFields,
  activeInputHasPressedEnter,
}: Partial<Props>) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, defaultValues } = {},
  } = formProps || ({} as SpaceFormProps);

  return (
    <>
      {/* SECTION: Centre Point of Contact */}
      <FormSectionTitle>Point of Contact Details</FormSectionTitle>

      <div className="flex items-center gap-2 col-span-full">
        <label className="text-muted-foreground text-sm">
          Same As Operator
        </label>
        <Switch
          className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400/60"
          checked={pocSameAsOperator}
          onCheckedChange={(checked) => {
            setPOCSameAsOperator?.(checked);
            autoSave?.();
          }}
        />
      </div>

      <FormField
        label="Name"
        labelPosition="embedded"
        placeholder="John Doe"
        readOnly={pocSameAsOperator}
        disabled={pocSameAsOperator}
        {...register?.("person.name")}
        error={errors?.person?.name}
        {...changedFieldProps?.(personChangesAllData, "name")}
      />

      <FormField
        label="Email"
        labelPosition="embedded"
        type="email"
        readOnly={pocSameAsOperator}
        disabled={pocSameAsOperator}
        placeholder="john.doe@example.com"
        {...register?.("person.email")}
        error={errors?.person?.email}
        {...changedFieldProps?.(personChangesAllData, "email")}
      />

      <FormField
        name="person.contactNo"
        key={`poc-same-${pocSameAsOperator}-${defaultValues?.person?.contactNo}`}
        label="Telephone"
        labelPosition="embedded"
        type="tel"
        inputMode="tel"
        inputType="phone"
        readOnly={pocSameAsOperator}
        disabled={pocSameAsOperator}
        defaultValue={defaultValues?.person?.contactNo}
        value={watch?.("person.contactNo")}
        {...changedFieldProps?.(personChangesAllData, "contactNo")}
        placeholder="+1-123-456-7890"
        onChange={(val) => {
          console.log("POC contact number:", val);
          setValue?.("person.contactNo", val?.toString() || "", {
            shouldValidate: true,
          });
        }}
        onBlur={() => {
          if (activeInputHasPressedEnter?.current?.["person.contactNo"]) {
            autoSave?.();
          } else {
            revertAllFormFields?.();
          }
          if (activeInputHasPressedEnter?.current) {
            activeInputHasPressedEnter.current["person.contactNo"] = false;
          }
        }}
        error={errors?.person?.contactNo}
      />

      <FormField
        label="Designation"
        placeholder="Centre Manager"
        labelPosition="embedded"
        readOnly={pocSameAsOperator}
        disabled={pocSameAsOperator}
        {...register?.("person.role")}
        error={errors?.person?.role}
        {...changedFieldProps?.(personChangesAllData, "role")}
      />
    </>
  );
}