import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { MessageSquareWarning } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAmenities } from "@/services/hooks/useAmenities";
import { getSpaceById, updateSpace } from "@/services/apis/admin/spaces";
import { spaceSchema, type SpaceSchema } from "@/utils/schemas/spaces";
import { datifyObjectValues } from "@/utils/object/datify";
import { queryKeys } from "@/utils/query-keys";
import { days, shortDays } from "@/utils/data/days";
import { spaceCategories } from "@/utils/data/category";
import { workingSizes, type WorkingSize } from "@/utils/data/workingSizes";
import { labelledSpaceTypes, spaceGrades } from "@/utils/data/spaceTypes";
import { GroupedSearchSelect } from "@/components/search-select";
import SelectAmenities from "@/containers/amenities/select-dialog";
import { DialogModal } from "@/components/dialog";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import MapsField from "@/components/maps";
import ChippedElements from "@/components/chips";
import ActionButton from "@/components/buttons/action-btn";
import type { Operator } from "@/types/data/operators";
import type { Dump } from "@/types/data/dump";
import type { Space } from "@/types/data/spaces";
import { compareFields } from "@/utils/object/compare";
import { deleteDump, recorrectDump } from "@/services/apis/admin/dump";
import { highlightFieldClassName } from "@/utils/string/field-change-classname";

const defaultTime = moment().hour(0).minute(0).toDate();

const SpaceEditPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { from: fromRoute, data: locData } = useMemo(() => {
    const state = location.state as
      | undefined
      | null
      | { from?: string; data?: Dump<Space> };
    return state || {};
  }, [location.state]);

  const isDump = useMemo(
    () => fromRoute === "notifications" && !!locData,
    [fromRoute, locData],
  );

  const { amenitiesData } = useAmenities();

  // Fetch Data using Centre ID
  const { data: res, isFetching } = useQuery({
    queryKey: [queryKeys.SPACES, id],
    queryFn: () =>
      getSpaceById({ query: { withOperator: true }, url: `/${id}` }),
    enabled: !!id,
  });
  console.log("space data", res?.data);

  // Get added or changed fields
  const { mainChanges, locationChanges, personChanges, pricingChanges } =
    useMemo(() => {
      const currentData = res?.data?.data;
      const notificationData =
        fromRoute === "notifications" ? locData?.data : undefined;

      return {
        mainChanges: compareFields(currentData, notificationData, {
          excludeFields: [
            "id",
            "createdAt",
            "updatedAt",
            "references",
            "location",
            "person",
            "pricing",
          ],
        }),
        locationChanges: compareFields(
          currentData?.location,
          notificationData?.location,
        ),
        personChanges: compareFields(currentData?.person, notificationData?.person),
        pricingChanges: compareFields(
          currentData?.pricing,
          notificationData?.pricing,
        ),
      };
    }, [res?.data, locData?.data, fromRoute]);

  const allUpdatedData = useMemo(() => {
    return {
      ...mainChanges.allData,
      ...(locationChanges.allFields.length
        ? {
            location: {
              ...res?.data?.data?.location,
              ...locationChanges.allData,
            },
          }
        : {}),
      ...(personChanges.allFields.length
        ? {
            person: {
              ...res?.data?.data?.person,
              ...personChanges.allData,
            },
          }
        : {}),
      ...(pricingChanges.allFields.length
        ? {
            pricing: {
              ...res?.data?.data?.pricing,
              ...pricingChanges.allData,
            },
          }
        : {}),
    };
  }, [
    mainChanges.allData,
    locationChanges.allData,
    locationChanges.allFields.length,
    personChanges.allData,
    personChanges.allFields.length,
    pricingChanges.allData,
    pricingChanges.allFields.length,
    res?.data?.data?.location,
    res?.data?.data?.person,
    res?.data?.data?.pricing,
  ]);
  console.log("Changed space data :", allUpdatedData);

  const changedFieldProps = (
    data: Record<string, unknown> | null | undefined,
    field: string,
  ) => {
    if (fromRoute !== "notifications" || !locData) return {};

    const className = highlightFieldClassName(data, field);
    if (!className) return {};

    return {
      embeddedWrapperProps: {
        className,
      },
    };
  };

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
      pricing: {
        dayPass: 0,
        dedicatedDesk: 0,
        perSeat: 0,
        flexiDesk: 0,
        privateCabin: 0,
      },
    },
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
  const [correctionComment, setCorrectionComment] = useState("");
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);

  // useEffect(() => {
  //   if (data) {
  //     reset(data);
  //   }
  // }, [data]);
  useEffect(() => {
    if (res?.data?.data) {
      const modified = datifyObjectValues(
        { ...res?.data?.data, ...allUpdatedData },
        ["closeTime", "openTime", "createdAt", "updatedAt"],
      );
      reset?.({
        openTime: defaultTime,
        closeTime: defaultTime,
        slug: modified?.references?.operator?.slug,
        ...modified,
        person: {
          ...(POCSameAsOperator
            ? operatorData?.person
            : res?.data?.data?.person),
          ...allUpdatedData?.person,
        },
      } as NonNullable<typeof modified>);
    }
  }, [res, POCSameAsOperator, operatorData, allUpdatedData]);

  // Update Mutater
  const { mutateAsync, isPending: updateLoading } = useMutation({
    mutationFn: updateSpace,
  });

  const { mutateAsync: approvalMutater, isPending: approvalPending } =
    useMutation({
      mutationKey: [queryKeys.DUMPS, id, "delete"],
      mutationFn: deleteDump,
    });

  const { mutateAsync: correctionMutater, isPending: correctionPending } =
    useMutation({
      mutationKey: [queryKeys.DUMPS, id, "recorrect"],
      mutationFn: recorrectDump,
    });

  const onSubmit = async (body: SpaceSchema) => {
    try {
      console.log("Space edit body", body);

      const res = await mutateAsync({
        url: id,
        body,
      });

      if (isDump) {
        const dumpRes = await approvalMutater({ url: locData?.id });
        if (dumpRes.status !== 200) {
          throw new Error("Dump approval failed");
        }
      }

      if (res.status === 200) {
        toast.success(`Centre ${isDump ? "approved" : "updated"} successfully`);
        navigate(isDump ? "/notifications" : "/spaces");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to update space");
    }
  };

  const handleSendToCorrection = async () => {
    if (!locData?.id) return;

    if (!correctionComment.trim()) {
      toast.error("Please add a correction comment");
      return;
    }

    try {
      const res = await correctionMutater({
        url: locData.id,
        body: {
          comment: correctionComment.trim(),
          status: "recorrect",
          to: locData.from?.id,
        },
      });

      if (res.status === 200) {
        toast.success("Sent to correction");
        setIsCorrectionDialogOpen(false);
        navigate("/notifications");
        return;
      }

      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error sending correction:", err);
      toast.error("Failed to send correction");
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
        {isDump && locData?.comment && (
          <div className="mb-5 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
              <MessageSquareWarning className="size-4" />
              Correction requested
            </div>
            <p className="leading-relaxed text-amber-50/90">{locData.comment}</p>
          </div>
        )}

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
            {...changedFieldProps(mainChanges.allData, "name")}
          />

          <FormField
            label="Slug"
            labelPosition="embedded"
            placeholder="my-centre-slug"
            disabled
            readOnly
            {...register("slug")}
            error={errors.slug}
            {...changedFieldProps(mainChanges.allData, "slug")}
          />

          <FormField
            label="Email"
            labelPosition="embedded"
            type="email"
            placeholder="centre@example.com"
            {...register("email")}
            error={errors.email}
            {...changedFieldProps(mainChanges.allData, "email")}
          />

          <FormField
            label="Operator"
            labelPosition="embedded"
            value={operatorData?.name || "None"}
            readOnly
            disabled
            error={errors.operator}
            {...changedFieldProps(mainChanges.allData, "operator")}
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
            {...changedFieldProps(mainChanges.allData, "category")}
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
                onValueChange: (val) =>
                  setValue("spaceType", val as SpaceSchema["spaceType"], {
                    shouldValidate: true,
                  }),
              },
            }}
            error={errors.spaceType}
            {...changedFieldProps(mainChanges.allData, "spaceType")}
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
                onValueChange: (val) =>
                  setValue("grade", val as SpaceSchema["grade"], {
                    shouldValidate: true,
                  }),
              },
            }}
            {...changedFieldProps(mainChanges.allData, "grade")}
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
            {...changedFieldProps(mainChanges.allData, "openTime")}
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
            {...changedFieldProps(mainChanges.allData, "closeTime")}
          />

          <FormField
            label="Total Seats"
            labelPosition="embedded"
            type="number"
            {...register("totalSeats", { valueAsNumber: true })}
            error={errors.totalSeats}
            {...changedFieldProps(mainChanges.allData, "totalSeats")}
          />

          <FormField
            label="Booked Seats"
            labelPosition="embedded"
            type="number"
            {...register("bookedSeats", { valueAsNumber: true })}
            error={errors.bookedSeats}
            {...changedFieldProps(mainChanges.allData, "bookedSeats")}
          />

          {/* Open Days */}

          {watch("spaceType", "Flex") !== "MOS" && (
            <FormField
              label="Operational Days"
              labelPosition="embedded"
              // embeddedWrapperProps={{className: "max-w-full"}}
              error={{
                message: errors.openDays?.message,
                type: errors.openDays?.type || "validate",
              }}
              {...changedFieldProps(mainChanges.allData, "openDays")}
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
                          className=""
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
              {...changedFieldProps(mainChanges.allData, "operationalHrs")}
            />
          )}

          {/* Amenities */}
          <FormField
            label="Amenities"
            labelPosition="embedded"
            error={{
              message:
                errors.facilities?.[0]?.message || errors?.facilities?.message,
              type:
                errors.facilities?.[0]?.type ||
                errors?.facilities?.type ||
                "validate",
            }}
            {...changedFieldProps(mainChanges.allData, "facilities")}
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
            {...changedFieldProps(mainChanges.allData, "workingSizes")}
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
            {...changedFieldProps(mainChanges.allData, "area")}
          />
          <FormField
            label="Training Room"
            labelPosition="embedded"
            placeholder="20 (pax)"
            type="number"
            min={0}
            {...register("trainingRoom")}
            error={errors.trainingRoom}
            {...changedFieldProps(mainChanges.allData, "trainingRoom")}
          />
          <FormField
            label="Meeting Room"
            labelPosition="embedded"
            placeholder="4 (pax)"
            type="number"
            min={0}
            {...register("meetingRoom")}
            error={errors.meetingRoom}
            {...changedFieldProps(mainChanges.allData, "meetingRoom")}
          />
          <FormField
            label="Conference Room"
            labelPosition="embedded"
            placeholder="10 (pax)"
            type="number"
            min={0}
            {...register("conferenceRoom")}
            error={errors.conferenceRoom}
            {...changedFieldProps(mainChanges.allData, "conferenceRoom")}
          />
          <FormField
            label="Description"
            labelPosition="embedded"
            placeholder="Enter description"
            {...register("description")}
            error={errors.description}
            inputType="textarea"
            {...changedFieldProps(mainChanges.allData, "description")}
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
            {...changedFieldProps(pricingChanges.allData, "dayPass")}
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
            {...changedFieldProps(pricingChanges.allData, "perSeat")}
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
            {...changedFieldProps(pricingChanges.allData, "dedicatedDesk")}
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
            {...changedFieldProps(pricingChanges.allData, "flexiDesk")}
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
            {...changedFieldProps(pricingChanges.allData, "privateCabin")}
          />

          {/* Location */}
          <FormSectionTitle>Location Details</FormSectionTitle>

          <FormField
            label="City"
            labelPosition="embedded"
            placeholder="Mumbai"
            {...register("location.city")}
            error={errors.location?.city}
            {...changedFieldProps(locationChanges.allData, "city")}
          />

          <FormField
            label="State"
            labelPosition="embedded"
            placeholder="Maharashtra"
            {...register("location.state")}
            error={errors.location?.state}
            {...changedFieldProps(locationChanges.allData, "state")}
          />

          <FormField
            label="Country"
            labelPosition="embedded"
            placeholder="India"
            {...register("location.country")}
            error={errors.location?.country}
            {...changedFieldProps(locationChanges.allData, "country")}
          />

          <FormField
            label="Area"
            labelPosition="embedded"
            placeholder="Panvel"
            {...register("location.area")}
            error={errors.location?.area}
            {...changedFieldProps(locationChanges.allData, "area")}
          />

          <FormField
            label="Zip Code"
            labelPosition="embedded"
            placeholder="349203"
            {...register("location.postalCode")}
            error={errors.location?.postalCode}
            {...changedFieldProps(locationChanges.allData, "postalCode")}
          />

          <FormField
            label="Latitude"
            labelPosition="embedded"
            type="number"
            step="any"
            {...register("location.lat")}
            error={errors.location?.lat}
            {...changedFieldProps(locationChanges.allData, "lat")}
          />

          <FormField
            label="Longitude"
            labelPosition="embedded"
            type="number"
            step="any"
            {...register("location.lng")}
            error={errors.location?.lng}
            {...changedFieldProps(locationChanges.allData, "lng")}
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
            {...changedFieldProps(locationChanges.allData, "address")}
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
            {...changedFieldProps(personChanges.allData, "name")}
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
            {...changedFieldProps(personChanges.allData, "email")}
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
            {...changedFieldProps(personChanges.allData, "contactNo")}
            placeholder="+1-123-456-7890"
            onChange={(val) => {
              console.log("POC contact number:", val);
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
            {...changedFieldProps(personChanges.allData, "role")}
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

            <div className="flex items-center  gap-4">
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
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isDump && (
                <DialogModal
                  open={isCorrectionDialogOpen}
                  onOpenChange={setIsCorrectionDialogOpen}
                  triggerProps={{
                    children: (
                      <ActionButton
                        type="button"
                        variant="outline"
                        className="max-w-fit"
                        loading={correctionPending}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquareWarning className="size-4" />
                          <span>Send to correction</span>
                        </div>
                      </ActionButton>
                    ),
                  }}
                  titleProps={{ children: "Send To Correction" }}
                  descriptionProps={{
                    children:
                      "Add a short note explaining what needs to be corrected before approval.",
                  }}
                  footerProps={{
                    children: (
                      <ActionButton
                        type="button"
                        loading={correctionPending}
                        onClick={handleSendToCorrection}
                      >
                        Send
                      </ActionButton>
                    ),
                  }}
                >
                  <FormField
                    label="Correction comment"
                    inputType="textarea"
                    labelPosition="out"
                    placeholder="Mention what needs to be corrected..."
                    value={correctionComment}
                    onChange={(event) =>
                      setCorrectionComment(event.currentTarget.value)
                    }
                  />
                </DialogModal>
              )}

              <ActionButton
                type="submit"
                loading={updateLoading || approvalPending}
                className="max-w-fit"
              >
                {isDump ? "Approve" : "Update Centre"}
              </ActionButton>
            </div>
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
                    Move to bin
                  </ActionButton>
                ),
              }}
              titleProps={{ children: "Centre Delete Confirmation" }}
              descriptionProps={{
                children:
                  "Are you sure to delete this centre ? You cannot undo this action.",
              }}
            >
              <ActionButton variant={"destructive"}>Move to bin</ActionButton>
            </DialogModal>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpaceEditPage;

