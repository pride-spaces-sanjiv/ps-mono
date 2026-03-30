import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { Switch } from "@/components/ui/switch";
import { useAmenities } from "@/services/hooks/useAmenities";
import { createSpace } from "@/services/apis/admin/spaces";
import { spaceSchema, type SpaceSchema } from "@/utils/schemas/spaces";
import { generateSlug } from "@/utils/string/slug";
import { queryKeys } from "@/utils/query-keys";
import { days, shortDays } from "@/utils/data/days";
import { spaceCategories } from "@/utils/data/category";
import {
  spaceTypes,
  spaceGrades,
  labelledSpaceTypes,
} from "@/utils/data/spaceTypes";
import { workingSizes, type WorkingSize } from "@/utils/data/workingSizes";
import MapsField from "@/components/maps";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import { GroupedSearchSelect } from "@/components/search-select";
import ChippedElements from "@/components/chips";
import ActionButton from "@/components/buttons/action-btn";
import SelectAmenities from "@/containers/amenities/select-dialog";
import type { Operator } from "@/types/data/operators";
import { validateNumber } from "@/utils/number";

const defaultTime = moment().hour(0).minute(0).toDate();

type LocState = {
  operatorData: Operator | null;
};

const SpaceCreatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { operatorData } = useMemo(
    () => location.state as Partial<LocState>,
    [location.state],
  );

  const { amenitiesData } = useAmenities();

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
    defaultValues: {
      openDays: days.map((_, i) => i + 1).filter((_, i) => i < 7),
      category: "Classic",
      spaceType: "Flex",
      grade: "B",
      openTime: defaultTime,
      closeTime: defaultTime,
      operationalHrs: 0,
      isActive: true,
      pricing: {
        dayPass: 0,
        dedicatedDesk: 0,
        perSeat: 0,
        flexiDesk: 0,
        privateCabin: 0,
      },
    },
  });
  const [POCSameAsOperator, setPOCSameAsOperator] = useState(false);

  useEffect(() => {
    reset({
      ...defaultValues,
      slug: operatorData?.slug
        ? generateSlug(
          operatorData?.slug,
          validateNumber(operatorData?.totalSpaces, { invalidValue: -1 }) + 1,
        )
        : defaultValues?.slug,
      person: {
        ...(POCSameAsOperator ? operatorData?.person : defaultValues?.person),
      },
    });
  }, [POCSameAsOperator, operatorData]);

  // Update Mutater
  const { mutateAsync, isPending: createLoading } = useMutation({
    mutationFn: createSpace,
  });

  const onSubmit = async (body: SpaceSchema) => {
    try {
      console.log("Space body", body);

      const res = await mutateAsync({
        body,
      });
      if (res.status === 201) {
        toast.success("Space created successfully");
        navigate("/spaces");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to create space");
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
            items={spaceCategories.map((cat) => ({ label: cat, value: cat }))}
            error={errors.category}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.category,
                onValueChange: (val) =>
                  setValue("category", val as SpaceSchema["category"], {
                    shouldValidate: true,
                  }),
              },
            }}
          />

          <FormField
            key={`space-type-${defaultValues?.spaceType}`}
            label="Space Type"
            labelPosition="embedded"
            inputType="select"
            items={labelledSpaceTypes}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.spaceType,
                onValueChange: (val) => {
                  setValue("spaceType", val as SpaceSchema["spaceType"], {
                    shouldValidate: true,
                  });
                },
              },
            }}
            error={errors.spaceType}
          />

          <FormField
            key={`space-grade-${defaultValues?.grade}`}
            label="Grade"
            labelPosition="embedded"
            inputType="select"
            items={spaceGrades.map((grade) => ({ label: grade, value: grade }))}
            error={errors.grade}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.grade,
                onValueChange: (val) => {
                  setValue("grade", val as SpaceSchema["grade"], {
                    shouldValidate: true,
                  });
                },
              },
            }}
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
          {watch("spaceType", "Flex") !== "MOS" && (
            <FormField
              label="Operational Days"
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
                      className={
                        "min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto"
                      }
                    >
                      {watch("openDays", []).length > 0 ? (
                        <ChippedElements
                          elements={watch("openDays", [])
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
                  setValue(
                    "openDays",
                    items.filter((val) => typeof val === "number"),
                  );
                }}
              />
            </FormField>
          )}

          {/* Operational Hours */}
          {watch("spaceType", "Flex") !== "Flex" && (
            <FormField
              type="number"
              inputMode="numeric"
              min={0}
              max={24}
              label="Operational Hours"
              labelPosition="embedded"
              error={errors.operationalHrs}
              {...register("operationalHrs")}
            />
          )}

          {/* Amenities */}
          <FormField
            label="Amenities"
            labelPosition="embedded"
            error={{
              message: errors.facilities?.message,
              type: errors.facilities?.type || "validate",
            }}
          >
            <SelectAmenities
              className="grow-1 shrink-1 w-[200px] overflow-hidden overflow-x-auto"
              defaultAmenities={
                defaultValues?.facilities as string[] | undefined
              }
              onSelect={(amenities) => {
                console.log(amenities);
                setValue(
                  "facilities",
                  // @ts-ignore
                  amenities.map((a) => a.id),
                  { shouldValidate: true },
                );
              }}
            >
              {(watch("facilities", [])?.length || 0) > 0 ? (
                <ChippedElements
                  className=""
                  elements={amenitiesData
                    .filter((dt) => watch("facilities", [])?.includes(dt.id))
                    .map((dt) => dt.name)}
                />
              ) : (
                "Select Amenities"
              )}
            </SelectAmenities>
          </FormField>

          {/* Working Sizes */}
          <FormField
            label="Working Sizes"
            labelPosition="embedded"
            error={{
              message:
                errors.workingSizes?.[0]?.message ||
                errors?.workingSizes?.message,
              type:
                errors.workingSizes?.[0]?.type ||
                errors?.workingSizes?.type ||
                "validate",
            }}
          >
            <GroupedSearchSelect
              key={`working-sizes-${defaultValues?.workingSizes?.length}`}
              type="multiple"
              showSearch={false}
              defaultSelected={defaultValues?.workingSizes}
              items={workingSizes.map((dt, i) => ({
                label: dt + " mm",
                value: dt,
              }))}
              triggerProps={{
                children: (
                  <ActionButton
                    type="button"
                    variant={"outline"}
                    className={
                      "min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto"
                    }
                  >
                    {(watch("workingSizes", [])?.length || 0) > 0 ? (
                      <ChippedElements
                        elements={watch("workingSizes", [])?.map(
                          (s) => s + " mm",
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
                setValue(
                  "workingSizes",
                  items.filter(
                    (val) => typeof val === "string",
                  ) as WorkingSize[],
                );
              }}
            />
          </FormField>

          {/* Area in sq.ft */}
          <FormField
            label="Centre Area (in sq.ft)"
            labelPosition="embedded"
            placeholder="500"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("area")}
            error={errors.area}
          />
          <FormField
            label="Training Room"
            labelPosition="embedded"
            placeholder="20 (pax)"
            type="number"
            min={0}
          {...register("trainingRoom")}
          error={errors.trainingRoom}
          />
          <FormField
            label="Meeting Room"
            labelPosition="embedded"
            placeholder="4 (pax)"
            type="number"
            min={0}
          {...register("meetingRoom")}
          error={errors.meetingRoom}
          />
          <FormField
            label="Conference Room"
            labelPosition="embedded"
            placeholder="10 (pax)"
            type="number"
            min={0}
          {...register("conferenceRoom")}
          error={errors.conferenceRoom}
          />
          <FormField
            label="Description"
            labelPosition="embedded"
            placeholder="Enter description"
            {...register("description")}
            error={errors.description}
            inputType="textarea"
          />

          {/* Pricing Details */}
          <FormSectionTitle>Pricing Details</FormSectionTitle>
          <FormField
            label="Day Pass"
            labelPosition="embedded"
            placeholder="300"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.dayPass")}
            error={errors.pricing?.dayPass}
          />
          <FormField
            label="Per Seat"
            labelPosition="embedded"
            placeholder="300"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.perSeat")}
            error={errors.pricing?.perSeat}
          />
          <FormField
            label="Dedicated Desk"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.dedicatedDesk")}
            error={errors.pricing?.dedicatedDesk}
          />
          <FormField
            label="Flexi Desk"
            labelPosition="embedded"
            placeholder="1500"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.flexiDesk")}
            error={errors.pricing?.flexiDesk}
          />
          <FormField
            label="Private Cabin"
            labelPosition="embedded"
            placeholder="4000"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.privateCabin")}
            error={errors.pricing?.privateCabin}
          />

          {/* Location */}
          <FormSectionTitle>Location Details</FormSectionTitle>
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
            label="Area"
            labelPosition="embedded"
            placeholder="Panvel"
            {...register("location.area")}
            error={errors.location?.area}
          />

          <FormField
            label="Zip Code"
            labelPosition="embedded"
            placeholder="349203"
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

          {/* Maps */}
          <MapsField
            wrapperProps={{ className: "col-span-full flex flex-col gap-4" }}
            mapProps={{ mapContainerClassName: "min-h-[300px] w-full" }}
            buttonProps={{ className: "w-fit" }}
            onGeocodeLatLng={(res, coords) => {
              console.log(res);
              const oldData = watch("location");
              const data: SpaceSchema["location"] = {
                address: res.address || oldData.address,
                city: res.city || oldData.city,
                state: res.state || oldData.state,
                postalCode: res.postalCode || oldData.postalCode,
                country: res.country || oldData.country,
                area: res.area || oldData.area,
                lat: coords.lat || oldData.lat,
                lng: coords.lng || oldData.lng,
              };
              setValue("location", data, { shouldValidate: true });
            }}
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
            value={watch("person.contactNo")}
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
          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Same As Operator</label>
            <Switch
              className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400/60"
              onCheckedChange={(checked) => {
                setPOCSameAsOperator(checked);
              }}
            />
          </div>
                      
          </div>

          {/* Submit */}
          <div className="col-span-full flex justify-end">
            <ActionButton
              type="submit"
              loading={createLoading}
              className="max-w-fit"
            >
              Create Centre
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpaceCreatePage;
