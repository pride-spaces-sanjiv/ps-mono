import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { GroupedSearchSelect } from "@/components/search-select";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import MapsField from "@/components/maps";
import ActionButton from "@/components/buttons/action-btn";
import { useStatesCities } from "@/services/hooks/use-states-cities";
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

type Props = {
  formProps: SpaceFormProps;
  operatorData: Partial<Operator> | null;
  locationChangesAllData: ChangedAllData;
  changedFieldProps: ChangedFieldPropsFn;
};

export default function SpaceLocationDetailsSection({
  formProps,
  operatorData,
  locationChangesAllData,
  changedFieldProps,
}: Partial<Props>) {
  const { statesData, citiesData } = useStatesCities();

  const {
    register,
    watch,
    setValue,
    formState: { errors, defaultValues } = {},
  } = formProps || ({} as SpaceFormProps);

  return (
    <>
      {/* Location Section */}
      <FormSectionTitle>Location Details</FormSectionTitle>

      <div className="flex gap-2 w-full col-span-full">
        {/* Details */}
        <div className="flex flex-col gap-2 w-full">
          <FormField
            label="Country"
            labelPosition="embedded"
            placeholder="India"
            {...register?.("location.country")}
            error={errors?.location?.country}
            {...changedFieldProps?.(locationChangesAllData, "country")}
          />

          <FormField
            label="Location URL"
            labelPosition="embedded"
            placeholder="https://maps.app.goo.gl/..."
            // {...register("location.url")}
            defaultValue={defaultValues?.location?.url || undefined}
            onChange={(e) => {
              const val = e.currentTarget.value;
              setValue?.("location.url", val, { shouldValidate: true });
            }}
            error={errors?.location?.url}
            {...changedFieldProps?.(locationChangesAllData, "url")}
          />

          <FormField
            key={`states-${statesData.length}-def-${defaultValues?.location?.state}-op-${operatorData?.slug}`}
            label="State"
            labelPosition="embedded"
            error={errors?.location?.state}
            {...changedFieldProps?.(locationChangesAllData, "state")}
          >
            <GroupedSearchSelect
              type="single"
              defaultSelected={{
                value:
                  statesData?.find(
                    (state) =>
                      state.name === defaultValues?.location?.state,
                  )?.name ||
                  operatorData?.branches?.find((br) => br.isPrimary)?.name,
              }}
              items={statesData
                .filter((state) =>
                  operatorData?.branches && operatorData.branches.length > 0
                    ? operatorData.branches
                        .map((br) => br.code)
                        .includes(state.code as string)
                    : true,
                )
                .map((state) => ({
                  label: state.name,
                  value: state.name,
                  searchValue: [state.name, state.code]
                    .filter(Boolean)
                    .join(" "),
                }))}
              inputProps={{ placeholder: "Select State" }}
              triggerProps={{
                children: (
                  <ActionButton type="button" variant="outline">
                    {watch?.("location.state", "") || "Select State"}
                  </ActionButton>
                ),
              }}
              onSelect={(item) => {
                setValue?.("location.state", item?.value || "", {
                  shouldValidate: true,
                });
              }}
            />
          </FormField>
          <FormField
            key={`state-${watch?.("location.state", "")}-cities-${citiesData.length}-def-${defaultValues?.location?.city}-op-${operatorData?.slug}`}
            label="City"
            labelPosition="embedded"
            placeholder="Mumbai"
            error={errors?.location?.city}
            {...changedFieldProps?.(locationChangesAllData, "city")}
          >
            <GroupedSearchSelect
              type="single"
              defaultSelected={{
                value: citiesData?.find(
                  (city) => city.name === defaultValues?.location?.city,
                )?.name,
              }}
              items={citiesData
                .filter(
                  (city) =>
                    city.state ===
                    statesData.find(
                      (s) => s.name === watch?.("location.state", ""),
                    )?.code,
                )
                .map((city) => ({
                  label: city.name,
                  value: city.name,
                  searchValue: city.name,
                }))}
              inputProps={{ placeholder: "Select City" }}
              triggerProps={{
                children: (
                  <ActionButton type="button" variant="outline">
                    {watch?.("location.city", "") || "Select City"}
                  </ActionButton>
                ),
              }}
              onSelect={(item) => {
                setValue?.("location.city", item?.value || "", {
                  shouldValidate: true,
                });
              }}
            />
          </FormField>

          <FormField
            label="Area - Micro Market"
            labelPosition="embedded"
            placeholder="Panvel"
            {...register?.("location.area")}
            error={errors?.location?.area}
            {...changedFieldProps?.(locationChangesAllData, "area")}
          />

          <FormField
            label="Zip Code"
            labelPosition="embedded"
            placeholder="349203"
            {...register?.("location.postalCode")}
            error={errors?.location?.postalCode}
            {...changedFieldProps?.(locationChangesAllData, "postalCode")}
          />

          <FormField
            label="Address"
            labelPosition="embedded"
            inputType="textarea"
            {...register?.("location.address")}
            error={errors?.location?.address}
            {...changedFieldProps?.(locationChangesAllData, "address")}
          />
        </div>
        {/* Maps Preview */}
        <MapsField
          wrapperProps={{
            className: "flex flex-col gap-4 w-[300px] shrink-0",
          }}
          mapProps={{ mapContainerClassName: "min-h-[200px] w-full" }}
          buttonProps={{ className: "w-fit" }}
          defaultCoords={
            (!!watch?.("location.lat") &&
              !!watch?.("location.lng") && {
                lat: watch?.("location.lat"),
                lng: watch?.("location.lng"),
              }) ||
            undefined
          }
        />
      </div>
    </>
  );
}