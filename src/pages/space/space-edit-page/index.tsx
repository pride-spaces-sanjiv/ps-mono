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
import { GroupedSearchSelect } from "@/components/search-select";
import ActionButton from "@/components/buttons/action-btn";
import type { Operator } from "@/types/data/operators";

const defaultTime = moment().hour(0).minute(0).toDate();

const SpaceEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch Data using Centre ID
  const { data: res, isFetching } = useQuery({
    queryKey: [queryKeys.SPACES, id],
    queryFn: () =>
      getSpaceById({ query: { withOperator: true }, url: `/${id}` }),
    enabled: !!id,
  });
  console.log("space data", res?.data);

  // form builder 
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
        slug: modified?.references?.operator?.slug,
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
        <h1 className="text-2xl font-bold  w-full">
          Edit Centre: {watch("name", "")}
        </h1>
      </div>

      <div className="w-full max-w-4xl mx-auto py-8">

        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Space edit form error", errors);
          })}
          className="auto-form-grid"
        >

          {/* SECTION: Centre Details */}

          <div className="col-span-full  mb-6 ">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold  italic text-white/90 tracking-wide ">
                Centre Details
              </h1>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
          </div>

          <FormField
            label="Name"
            placeholder="My Centre"
            {...register("name")}
            error={errors.name}
          />

          <FormField
            label="Slug"
            placeholder="my-centre-slug"
            {...register("slug")}
            error={errors.slug}
          />

          <FormField
            label="Email"
            type="email"
            placeholder="centre@example.com"
            {...register("email")}
            error={errors.email}
          />

          <FormField
            label="Operator"
            value={operatorData?.name || "None"}
            readOnly
            disabled
            error={errors.operator}
          />

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

          <FormField
            label="Total Seats"
            type="number"
            {...register("totalSeats", { valueAsNumber: true })}
            error={errors.totalSeats}
          />

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

          <FormField
            label="Description"
            placeholder="Enter description"
            {...register("description")}
            error={errors.description}
            inputType="textarea"
          />

          {/* Location */}

          <FormField
            label="City"
            {...register("location.city")}
            error={errors.location?.city}
          />

          <FormField
            label="State"
            {...register("location.state")}
            error={errors.location?.state}
          />

          <FormField
            label="Country"
            {...register("location.country")}
            error={errors.location?.country}
          />

          <FormField
            label="Postal Code"
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

          <FormField
            label="Address"
            {...register("location.address")}
            error={errors.location?.address}
            inputType="textarea"
          />

          {/* SECTION: Centre Point of Contact */}

          <div className="col-span-full  mt-8 mb-6 ">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold  italic text-white/90 tracking-wide ">
                Point of Contact Details
              </h1>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
          </div>

          <FormField
            label="Name"
            placeholder="John Doe"
            {...register("person.name")}
            error={errors?.person?.name}
          />

          <FormField
            label="Email"
            type="email"
            placeholder="john.doe@example.com"
            {...register("person.email")}
            error={errors?.person?.email}
          />

          <FormField
            label="Telephone"
            type="tel"
            inputMode="tel"
            placeholder="1234567890"
            {...register("person.contactNo")}
            error={errors?.person?.contactNo}
          />

          <FormField
        label="Designation"
        placeholder="Centre Manager"
        // {...register("person.role")}
        // error={errors?.person?.role}
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
              Update Centre
            </ActionButton>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SpaceEditPage;
