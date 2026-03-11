import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { getSpaceById, updateSpace } from "@/services/apis/admin/spaces";
import { spaceSchema, type SpaceSchema } from "@/utils/schemas/spaces";
import { datifyObjectValues } from "@/utils/object/datify";
import { queryKeys } from "@/utils/query-keys";
import { days } from "@/utils/data/days";
import { Checkbox } from "@/components/ui/checkbox";
import FormField from "@/components/form/field";
import { SelectPicker } from "@/components/select";
import GroupsSelectPicker from "@/components/groups-selector";
import { GroupedSearchSelect } from "@/components/search-select";
import ActionButton from "@/components/buttons/action-btn";
import type { Operator } from "@/types/data/operators";

const defaultTime = moment().hour(0).minute(0).toDate();

const SpaceEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: res, isFetching } = useQuery({
    queryKey: [queryKeys.SPACES, id],
    queryFn: () =>
      getSpaceById({ query: { withOperator: true }, url: `/${id}` }),
    enabled: !!id,
  });
  console.log("space data", res?.data);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(spaceSchema),
    defaultValues: { openTime: defaultTime, closeTime: defaultTime },
  });

  const operatorData = useMemo(
    () =>
      (res?.data?.data?.references?.operator as
        | Partial<Operator>
        | null
        | undefined) || null,
    [res?.data],
  );

  // useEffect(() => {
  //   if (data) {
  //     reset(data);
  //   }
  // }, [data]);
  useEffect(() => {
    if (res?.data.data) {
      const modified = datifyObjectValues(res?.data.data, [
        "closeTime",
        "openTime",
        "createdAt",
        "updatedAt",
      ]);
      reset({
        openTime: defaultTime,
        closeTime: defaultTime,
        ...modified,
      } as NonNullable<typeof modified>);
    }
  }, [res]);

  const { mutateAsync, isPending: updateLoading } = useMutation({
    mutationFn: updateSpace,
  });

  const onSubmit = async (body: SpaceSchema) => {
    try {
      console.log("Space edit body", body);

      await mutateAsync({
        url: id,
        body,
      });
      console.log("Space edit body", body);

      toast.success("Space updated successfully");

      navigate("/spaces");
    } catch (err) {
      toast.error("Failed to update space");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold"> Edit Space: {watch("name", "")}</h1>
      </div>

      <div className="w-full max-w-4xl mx-auto py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Space edit form error", errors);
          })}
          className="auto-form-grid"
        >
          {/* Name */}
          <FormField
            label="Space Name"
            placeholder="My Space"
            {...register("name")}
            error={errors.name}
          />

          {/* Slug */}
          <FormField
            label="Slug"
            placeholder="my-space-slug"
            {...register("slug")}
            error={errors.slug}
          />

          {/* Email */}
          <FormField
            label="Email"
            type="email"
            placeholder="my-space@example.com"
            {...register("email")}
            error={errors.email}
          />

          {/* Branch */}
          {/* <FormField
            label="Branch"
            {...register("branch")}
            readOnly
            disabled
            error={errors.branch}
          /> */}

          {/* Operator */}
          <FormField
            label="Operator"
            value={operatorData?.name || "None"}
            // {...register("operator")}
            readOnly
            disabled
            error={errors.operator}
          />

          {/* Person Data */}
          <FormField
            label="Person Name"
            placeholder="John Doe"
            {...register("person.name")}
            error={errors?.person?.name}
          />
          <FormField
            label="Person Email"
            type="email"
            placeholder="john.doe@example.com"
            {...register("person.email")}
            error={errors?.person?.email}
          />
          <FormField
            label="Person Contact No"
            type="tel"
            inputMode="tel"
            placeholder="1234567890"
            {...register("person.contactNo")}
            error={errors?.person?.contactNo}
          />
          {/*  */}

          {/* Open Time */}
          <FormField
            label="Open Time"
            type="time"
            key={defaultValues?.openTime?.toISOString()}
            defaultValue={
              defaultValues?.openTime
                ? moment(defaultValues?.openTime).format("HH:mm")
                : undefined
            }
            onChange={(e) => {
              const val = e.currentTarget.value;
              setValue("openTime", moment(val, "HH:mm", true).toDate(), {
                shouldValidate: true,
              });
            }}
            error={errors.openTime}
          />

          {/* Close Time */}
          <FormField
            label="Close Time"
            type="time"
            key={defaultValues?.closeTime?.toISOString()}
            defaultValue={
              defaultValues?.closeTime
                ? moment(defaultValues?.closeTime).format("HH:mm")
                : undefined
            }
            onChange={(e) => {
              const val = e.currentTarget.value;
              setValue("closeTime", moment(val, "HH:mm", true).toDate(), {
                shouldValidate: true,
              });
            }}
            error={errors.closeTime}
          />

          {/* Total Seats */}
          <FormField
            label="Total Seats"
            type="number"
            {...register("totalSeats", { valueAsNumber: true })}
            error={errors.totalSeats}
          />

          {/* Booked Seats */}
          <FormField
            label="Booked Seats"
            type="number"
            {...register("bookedSeats", { valueAsNumber: true })}
            error={errors.bookedSeats}
          />

          {/* Open Days */}
          <FormField
            label="Open Days"
            error={{
              message: errors.openDays?.message,
              type: errors.openDays?.type || "validate",
            }}
          >
            <GroupedSearchSelect
              key={`days-${defaultValues?.openDays?.length}`}
              type="multiple"
              defaultSelected={defaultValues?.openDays}
              items={days.map((dt, i) => ({
                label: dt,
                value: i + 1,
              }))}
              triggerProps={{
                children: (
                  <ActionButton
                    type="button"
                    variant={"secondary"}
                    className={"min-h-[40px]"}
                  >
                    {watch("openDays", []).length > 0
                      ? watch("openDays", []).length
                      : "Select Days"}
                  </ActionButton>
                ),
              }}
              contentProps={{ className: "max-h-[300px]" }}
              onSelect={(items) => {
                setValue(
                  "openDays",
                  items.filter((val) => typeof val === "number"),
                );
              }}
            />
          </FormField>

          {/* Description */}
          <FormField
            label="Description"
            placeholder="Enter a description for your space"
            {...register("description")}
            error={errors.description}
            inputType="textarea"
          />

          {/* Location Fields */}

          <FormField
            label="City"
            placeholder="Enter the city"
            {...register("location.city")}
            error={errors.location?.city}
          />

          <FormField
            label="State"
            placeholder="Enter the state"
            {...register("location.state")}
            error={errors.location?.state}
          />

          <FormField
            label="Country"
            placeholder="Enter the country"
            {...register("location.country")}
            error={errors.location?.country}
          />

          <FormField
            label="Postal Code"
            placeholder="Postal Code"
            {...register("location.postalCode")}
            error={errors.location?.postalCode}
          />

          <FormField
            label="Latitude"
            type="number"
            step="any"
            {...register("location.lat")}
            error={errors.location?.lat}
          />

          <FormField
            label="Longitude"
            type="number"
            step="any"
            {...register("location.lng")}
            error={errors.location?.lng}
          />

          {/* Address */}
          <FormField
            label="Address"
            placeholder="Enter address"
            {...register("location.address")}
            error={errors.location?.address}
            inputType="textarea"
          />

          {/* Status */}

          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Active</label>
            <Checkbox
              key={defaultValues?.isActive ? "active" : "inactive"}
              defaultChecked={!!defaultValues?.isActive}
              {...register("isActive")}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Verified</label>
            <Checkbox
              key={defaultValues?.isVerified ? "verified" : "unverified"}
              defaultChecked={!!defaultValues?.isVerified}
              {...register("isVerified")}
            />
          </div>

          {/* Submit */}

          <div className="col-span-full flex justify-end">
            <ActionButton
              type="submit"
              loading={updateLoading}
              className="max-w-fit"
            >
              Update Space
            </ActionButton>
          </div>
        </form>
      </div>
      {/* <UserCreateModal /> */}
      {/* <UsersTabledResults /> */}
    </div>
  );
};

export default SpaceEditPage;
