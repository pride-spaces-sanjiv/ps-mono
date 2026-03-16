import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { getSpaceById, updateSpace } from "@/services/apis/admin/spaces";
import { spaceSchema, type SpaceSchema } from "@/utils/schemas/spaces";
import { datifyObjectValues } from "@/utils/object/datify";
import { queryKeys } from "@/utils/query-keys";
import { days } from "@/utils/data/days";
import { facilities } from "@/utils/data/facilities";
import { spaceCategories } from "@/utils/data/category";
import FormField from "@/components/form/field";
import { GroupedSearchSelect } from "@/components/search-select";
import { DialogModal } from "@/components/dialog";
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
  const [POCSameAsOperator, setPOCSameAsOperator] = useState(false);

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
        person: {
          ...(POCSameAsOperator
            ? operatorData?.person
            : res?.data?.data?.person),
        },
      } as NonNullable<typeof modified>);
    }
  }, [res, POCSameAsOperator, operatorData]);

  // Update Mutater
  const { mutateAsync, isPending: updateLoading } = useMutation({
    mutationFn: updateSpace,
  });

  const onSubmit = async (body: SpaceSchema) => {
    try {
      console.log("Space edit body", body);

      const res = await mutateAsync({
        url: id,
        body,
      });
      if (res.status === 200) {
        toast.success("Space updated successfully");
        navigate("/spaces");
        return;
      }
      throw new Error("Invalid response");
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
            labelPosition="embedded"
            placeholder="My Centre"
            {...register("name")}
            error={errors.name}
          />

          <FormField
            label="Slug"
            labelPosition="embedded"
            placeholder="my-centre-slug"
            {...register("slug")}
            error={errors.slug}
          />

          <FormField
            label="Email"
            labelPosition="embedded"
            type="email"
            placeholder="centre@example.com"
            {...register("email")}
            error={errors.email}
          />

          <FormField
            label="Operator"
            labelPosition="embedded"
            value={operatorData?.name || "None"}
            readOnly
            disabled
            error={errors.operator}
          />

          <FormField
            key={`space-cat-${defaultValues?.category}`}
            label="Category"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.category}
            items={spaceCategories.map((cat) => ({ label: cat, value: cat }))}
            error={errors.category}
          />

          {/* Open Time */}

          <FormField
            label="Open Time"
            labelPosition="embedded"
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
            labelPosition="embedded"
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
            labelPosition="embedded"
            type="number"
            {...register("totalSeats", { valueAsNumber: true })}
            error={errors.totalSeats}
          />

          <FormField
            label="Booked Seats"
            labelPosition="embedded"
            type="number"
            {...register("bookedSeats", { valueAsNumber: true })}
            error={errors.bookedSeats}
          />

          {/* Open Days */}

          <FormField
            label="Open Days"
            labelPosition="embedded"
            error={{
              message: errors.openDays?.message,
              type: errors.openDays?.type || "validate",
            }}
          >
            <GroupedSearchSelect
              key={`days-${defaultValues?.openDays?.length}`}
              type="multiple"
              showSearch={false}
              defaultSelected={
                defaultValues?.openDays ||
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
                    className={"min-h-[40px] grow-1 border-0"}
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

          {/* Amenities */}
          <FormField
            label="Amenities"
            labelPosition="embedded"
            error={{
              message: errors.facilities?.message,
              type: errors.facilities?.type || "validate",
            }}
          >
            <GroupedSearchSelect
              key={`amenities-${defaultValues?.facilities?.length}`}
              type="multiple"
              inputProps={{ placeholder: "Search Amenity" }}
              defaultSelected={defaultValues?.facilities}
              items={facilities.map((dt, i) => ({
                label: dt,
                value: dt,
              }))}
              triggerProps={{
                children: (
                  <ActionButton
                    type="button"
                    variant={"outline"}
                    className={"min-h-[40px] grow-1 border-0"}
                  >
                    {(watch("facilities", [])?.length || 0) > 0
                      ? watch("facilities", [])?.length
                      : "Select Amenities"}
                  </ActionButton>
                ),
              }}
              contentProps={{ className: "max-h-[300px]" }}
              onSelect={(items) => {
                setValue(
                  "facilities",
                  items.filter((val) => typeof val === "string"),
                );
              }}
            />
          </FormField>

          <FormField
            label="Description"
            labelPosition="embedded"
            placeholder="Enter description"
            {...register("description")}
            error={errors.description}
            inputType="textarea"
          />

          {/* Location */}

          <FormField
            label="City"
            labelPosition="embedded"
            placeholder="Mumbai"
            {...register("location.city")}
            error={errors.location?.city}
          />

          <FormField
            label="State"
            labelPosition="embedded"
            placeholder="Maharashtra"
            {...register("location.state")}
            error={errors.location?.state}
          />

          <FormField
            label="Country"
            labelPosition="embedded"
            placeholder="India"
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
            labelPosition="embedded"
            type="number"
            step="any"
            {...register("location.lat")}
            error={errors.location?.lat}
          />

          <FormField
            label="Longitude"
            labelPosition="embedded"
            type="number"
            step="any"
            {...register("location.lng")}
            error={errors.location?.lng}
          />

          <FormField
            label="Address"
            labelPosition="embedded"
            inputType="textarea"
            {...register("location.address")}
            error={errors.location?.address}
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

          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Same As Operator</label>
            <Switch
              className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400/60"
              onCheckedChange={(checked) => {
                setPOCSameAsOperator(checked);
              }}
            />
          </div>

          <FormField
            label="Name"
            labelPosition="embedded"
            placeholder="John Doe"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            {...register("person.name")}
            error={errors?.person?.name}
          />

          <FormField
            label="Email"
            labelPosition="embedded"
            type="email"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            placeholder="john.doe@example.com"
            {...register("person.email")}
            error={errors?.person?.email}
          />

          <FormField
            key={`poc-same-${POCSameAsOperator}-${defaultValues?.person?.contactNo}`}
            label="Telephone"
            labelPosition="embedded"
            type="tel"
            inputMode="tel"
            inputType="phone"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            defaultValue={defaultValues?.person?.contactNo}
            placeholder="+1-123-456-7890"
            onChange={(val) => {
              console.log(val);
              setValue("person.contactNo", val?.toString() || "", {
                shouldValidate: true,
              });
            }}
            error={errors?.person?.contactNo}
          />

          <FormField
            label="Designation"
            placeholder="Centre Manager"
            labelPosition="embedded"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            {...register("person.role")}
            error={errors?.person?.role}
          />

          {/* Status */}
          <div className="col-span-full flex gap-8">
            <div className="flex items-center gap-4">
              <label className="text-white text-sm">Active</label>
              <Switch
                key={defaultValues?.isActive ? "active" : "inactive"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400/60"
                defaultChecked={!!defaultValues?.isActive}
                {...register("isActive")}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="text-white text-sm">Verified</label>
              <Switch
                key={defaultValues?.isVerified ? "verified" : "unverified"}
                defaultChecked={!!defaultValues?.isVerified}
                {...register("isVerified")}
              />
            </div>
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

          {/* Delete trigger */}
          <div className="col-span-full flex justify-center pt-4">
            <DialogModal
              triggerProps={{
                children: (
                  <ActionButton
                    type="button"
                    variant={"destructive"}
                    loading={updateLoading}
                    className="max-w-fit"
                  >
                    Delete Centre
                  </ActionButton>
                ),
              }}
              titleProps={{ children: "Centre Delete Confirmation" }}
              descriptionProps={{
                children:
                  "Are you sure to delete this centre ? You cannot undo this action.",
              }}
            >
              <ActionButton variant={"destructive"}>Delete Centre</ActionButton>
            </DialogModal>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpaceEditPage;
