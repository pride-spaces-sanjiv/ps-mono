import React, { useMemo } from "react";
import moment from "moment";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { GroupedSearchSelect } from "@/components/search-select";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import { SelectPicker } from "@/components/select";
import ChippedElements from "@/components/chips";
import ActionButton from "@/components/buttons/action-btn";
import { days, shortDays } from "@/utils/data/days";
import { spaceCategories } from "@/utils/data/category";
import {
  getDenotedWorkingSize,
  labelledWorkingSizes,
  type WorkingSize,
} from "@/utils/data/workingSizes";
import { labelledSpaceTypes } from "@/utils/data/spaceTypes";
import type { Operator } from "@/types/data/operators";
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
type TimeOption = { label: string; value: string };

type Props = {
  formProps: SpaceFormProps;
  operatorData: Partial<Operator> | null;
  operators: Operator[];
  timeOptions: TimeOption[];
  mainChangesAllData: ChangedAllData;
  changedFieldProps: ChangedFieldPropsFn;
  autoSave: AutoSaveFn;
  seatsHasPressedEnter: { current: boolean };
  isConfirmedRef: { current: boolean };
  setPendingFormData: (data: SpaceSchema | null) => void;
  setIsConfirmDialogOpen: (open: boolean) => void;
  currentBookedSeats: number;
  hasLoadedData: boolean;
  isNew: boolean;
};

export default function SpaceDetailsSection({
  formProps,
  operatorData,
  timeOptions,
  mainChangesAllData,
  changedFieldProps,
  autoSave,
  seatsHasPressedEnter,
  isConfirmedRef,
  setPendingFormData,
  setIsConfirmDialogOpen,
  currentBookedSeats = 0,
  hasLoadedData = false,
  isNew = false,
  operators = [],
}: Partial<Props>) {
  const { register, watch, setValue, formState } = useMemo<SpaceFormProps>(
    // @ts-ignore
    () => formProps || {},
    [formProps],
  );
  const { errors, defaultValues } = useMemo(() => formState || {}, [formState]);

  return (
    <>
      {/* SECTION: Centre Details */}
      <FormSectionTitle>Centre Details</FormSectionTitle>

      <FormField
        label="Centre Name"
        labelPosition="embedded"
        placeholder="My Centre"
        {...register?.("name")}
        error={errors?.name}
        {...changedFieldProps?.(mainChangesAllData, "name")}
      />

      <FormField
        label="Slug"
        labelPosition="embedded"
        placeholder="my-centre-slug"
        disabled
        readOnly
        {...register?.("slug")}
        error={errors?.slug}
        {...changedFieldProps?.(mainChangesAllData, "slug")}
      />

      <FormField
        label="Operator"
        labelPosition="embedded"
        value={operatorData?.name || "None"}
        readOnly
        disabled
        error={errors?.operator}
        {...changedFieldProps?.(mainChangesAllData, "operator")}
      >
        {isNew && operators && operators.length > 0 ? (
          <GroupedSearchSelect
            type="single"
            items={operators?.map((operator) => ({
              label: operator.name || operator.email || operator.id,
              value: operator.id,
              searchValue: [operator.name, operator.email, operator.slug]
                .filter(Boolean)
                .join(" "),
            }))}
            triggerProps={{
              children: (
                <ActionButton type="button" variant="outline">
                  {operatorData?.name || "Select Operator"}
                </ActionButton>
              ),
            }}
            onSelect={(item) => {
              const selectedOperator =
                operators.find((operator) => operator.id === item?.value) ||
                null;

              const primaryBranch =
                selectedOperator?.branches?.find(
                  (branch) => branch.isPrimary,
                ) || selectedOperator?.branches?.[0];

              setValue?.("operator", selectedOperator?.id || "", {
                shouldValidate: true,
              });
            }}
          />
        ) : (
          false
        )}
      </FormField>
      <FormField
        key={`space-cat-${defaultValues?.specs?.category}`}
        label="Category"
        labelPosition="embedded"
        inputType="select"
        items={spaceCategories.map((cat) => ({ label: cat, value: cat }))}
        error={errors?.specs?.category}
        pickerProps={{
          wrapperProps: {
            defaultValue: defaultValues?.specs?.category,
            onValueChange: (val) => {
              setValue?.(
                "specs.category",
                val as SpaceSchema["specs"]["category"],
                {
                  shouldValidate: true,
                },
              );
              autoSave?.();
            },
          },
        }}
        {...changedFieldProps?.(mainChangesAllData, "category")}
      />

      <FormField
        key={`space-type-${defaultValues?.specs?.spaceType}`}
        label="Space Type"
        labelPosition="embedded"
        inputType="select"
        items={labelledSpaceTypes}
        pickerProps={{
          wrapperProps: {
            defaultValue: defaultValues?.specs?.spaceType,
            onValueChange: (val) => {
              setValue?.(
                "specs.spaceType",
                val as SpaceSchema["specs"]["spaceType"],
                {
                  shouldValidate: true,
                },
              );
              if (val === "MOS") {
                setValue?.("pricing.dayPass", 0, { shouldValidate: true });
                setValue?.("pricing.meetingRoom", 0, {
                  shouldValidate: true,
                });
                setValue?.("pricing.dedicatedDesk", 0, {
                  shouldValidate: true,
                });
                setValue?.("pricing.flexiDesk", 0, { shouldValidate: true });
                setValue?.("pricing.vo", 0, { shouldValidate: true });
                setValue?.("flags.isVoService", false, {
                  shouldValidate: true,
                });
              }
              autoSave?.();
            },
          },
        }}
        error={errors?.specs?.spaceType}
        {...changedFieldProps?.(mainChangesAllData, "spaceType")}
      />
      {/* Open days */}
      <FormField
        label="Operational Days"
        labelPosition="embedded"
        error={{
          message: errors?.timing?.openDays?.message,
          type: errors?.timing?.openDays?.type || "validate",
        }}
        {...changedFieldProps?.(mainChangesAllData, "openDays")}
      >
        <GroupedSearchSelect
          key={`days-${defaultValues?.timing?.openDays?.length}`}
          type="multiple"
          showSearch={false}
          defaultSelected={
            defaultValues?.timing?.openDays ||
            days.map((_, i) => i + 1).filter((_, i) => i < 7)
          }
          items={days.map((dt, i) => ({
            label: dt,
            value: i + 1,
          }))}
          triggerProps={{
            children: (
              <ActionButton
                type="button"
                variant={"outline"}
                className={
                  "min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto justify-start"
                }
              >
                {(watch?.("timing.openDays", []).length ?? 0) > 0 ? (
                  <ChippedElements
                    className=""
                    elements={watch?.("timing.openDays", [])
                      .sort((a, b) => a - b)
                      .map((s) => shortDays[s - 1])
                      .filter((v) => !!v)}
                  />
                ) : (
                  "Select Days"
                )}
              </ActionButton>
            ),
          }}
          contentProps={{ className: "max-h-[300px]" }}
          onSelect={(items) => {
            setValue?.(
              "timing.openDays",
              items.filter((val) => typeof val === "number"),
              { shouldValidate: true },
            );
            autoSave?.();
          }}
        />
      </FormField>

      {/* Operating Hours (Unified Open & Close Time) */}
      <FormField
        label="Operating Hours"
        labelPosition="embedded"
        error={errors?.timing?.openTime || errors?.timing?.closeTime}
        {...changedFieldProps?.(mainChangesAllData, "openTime")}
      >
        <div className="flex items-center gap-1.5 px-2 py-1 grow shrink min-w-0 min-h-[40px] flex-nowrap">
          <SelectPicker
            key={`open-picker-${defaultValues?.timing?.openTime}-${timeOptions?.length}`}
            className="h-8 flex-1 min-w-0 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold rounded-md border-0 justify-between shadow-none px-2"
            items={timeOptions}
            valueProps={{ placeholder: "Start Time" }}
            wrapperProps={{
              defaultValue: defaultValues?.timing?.openTime
                ? moment(defaultValues.timing.openTime).format("HH:mm")
                : "09:00",
              onValueChange: (val) => {
                setValue?.(
                  "timing.openTime",
                  moment(val, "HH:mm", true).toDate(),
                  { shouldValidate: true },
                );
              },
            }}
          />
          <span className="text-xs font-semibold text-muted-foreground shrink-0 px-0.5 select-none">
            to
          </span>
          <SelectPicker
            key={`close-picker-${defaultValues?.timing?.closeTime}-${timeOptions?.length}`}
            className="h-8 flex-1 min-w-0 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold rounded-md border-0 justify-between shadow-none px-2"
            items={timeOptions}
            valueProps={{ placeholder: "End Time" }}
            wrapperProps={{
              defaultValue: defaultValues?.timing?.closeTime
                ? moment(defaultValues.timing.closeTime).format("HH:mm")
                : "18:00",
              onValueChange: (val) => {
                setValue?.(
                  "timing.closeTime",
                  moment(val, "HH:mm", true).toDate(),
                  { shouldValidate: true },
                );
              },
            }}
          />
        </div>
      </FormField>
      <FormField
        label="Total Seats"
        labelPosition="embedded"
        type="number"
        {...register?.("seats.total", {
          valueAsNumber: true,
        })}
        error={errors?.seats?.total}
        {...changedFieldProps?.(mainChangesAllData, "totalSeats")}
      />

      <FormField
        id="availableSeats"
        label="Available Seats"
        labelPosition="embedded"
        type="number"
        max={watch?.("seats.total", 0) ?? 0}
        min={0}
        value={
          (watch?.("seats.total", 0) ?? 0) - (watch?.("seats.booked", 0) ?? 0)
        }
        onChange={(e) => {
          const val = Number(e.currentTarget.value);
          const booked = (watch?.("seats.total", 0) ?? 0) - val;
          setValue?.("seats.booked", booked, { shouldValidate: true });
        }}
        onFocus={() => {
          if (seatsHasPressedEnter) {
            seatsHasPressedEnter.current = false;
          }
        }}
        onBlur={async (e) => {
          if (!seatsHasPressedEnter?.current) {
            if (hasLoadedData) {
              setValue?.("seats.booked", currentBookedSeats, {
                shouldValidate: true,
              });
            }
          }
          if (seatsHasPressedEnter) {
            seatsHasPressedEnter.current = false;
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            if (seatsHasPressedEnter) {
              seatsHasPressedEnter.current = true;
            }
            const val = Number(e.currentTarget.value);
            const booked = (watch?.("seats.total", 0) ?? 0) - val;
            if (!isNew && booked !== currentBookedSeats) {
              const latestData = watch?.();
              setPendingFormData?.({
                ...latestData,
                seats: {
                  ...latestData?.seats,
                  total: latestData?.seats?.total ?? 0,
                  booked,
                },
              } as any);
              if (isConfirmedRef) {
                isConfirmedRef.current = false;
              }

              setIsConfirmDialogOpen?.(true);
            }
            e.currentTarget.blur();
          }
        }}
        error={errors?.seats?.booked}
        {...changedFieldProps?.(mainChangesAllData, "seats")}
      />
      <FormField
        label="Occupancy (%)"
        labelPosition="embedded"
        value={`${
          (watch?.("seats.total") || 0) > 0
            ? (
                ((watch?.("seats.booked") || 0) /
                  (watch?.("seats.total") || 1)) *
                100
              ).toFixed(2)
            : "0.00"
        }%`}
        readOnly
        disabled
      />

      {/* Working Sizes */}
      <FormField
        label="Work Station Sizes"
        labelPosition="embedded"
        error={{
          message:
            errors?.specs?.workingSizes?.[0]?.message ||
            errors?.specs?.workingSizes?.message,
          type:
            errors?.specs?.workingSizes?.[0]?.type ||
            errors?.specs?.workingSizes?.type ||
            "validate",
        }}
        {...changedFieldProps?.(mainChangesAllData, "workingSizes")}
      >
        <GroupedSearchSelect
          key={`working-sizes-${defaultValues?.specs?.workingSizes?.length}`}
          type="multiple"
          showSearch={false}
          defaultSelected={defaultValues?.specs?.workingSizes}
          items={labelledWorkingSizes}
          triggerProps={{
            children: (
              <ActionButton
                type="button"
                variant={"outline"}
                className={
                  "min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto"
                }
              >
                {(watch?.("specs.workingSizes", [])?.length || 0) > 0 ? (
                  <ChippedElements
                    elements={watch?.("specs.workingSizes", [])?.map(
                      // (s) => s + " mm",
                      (s) => getDenotedWorkingSize(s),
                    )}
                  />
                ) : (
                  "Select Working Sizes"
                )}
              </ActionButton>
            ),
          }}
          contentProps={{ className: "max-h-[300px]" }}
          onSelect={(items) => {
            setValue?.(
              "specs.workingSizes",
              items.filter((val) => typeof val === "string") as WorkingSize[],
              { shouldValidate: true },
            );
            autoSave?.();
          }}
        />
      </FormField>

      {/* Operational Since (year) */}
      <FormField
        label="Operational Since (year)"
        labelPosition="embedded"
        placeholder="2024"
        type="number"
        {...register?.("timing.operationalSince")}
        error={errors?.timing?.operationalSince as any}
        {...changedFieldProps?.(mainChangesAllData, "operationalSince")}
      />

      {/* Area in sq.ft */}
      <FormField
        label="Centre Area In Sq. Ft. (approx)"
        labelPosition="embedded"
        placeholder="500"
        type="number"
        inputMode="decimal"
        min={0}
        {...register?.("specs.area", { valueAsNumber: true })}
        error={errors?.specs?.area}
        {...changedFieldProps?.(mainChangesAllData, "area")}
      />
    </>
  );
}
