import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { Switch } from "@/components/ui/switch";
import { useAmenities } from "@/services/hooks/useAmenities";
import { createSpace as createAdminSpace } from "@/services/apis/admin/spaces";
import { createSpace as createOperatorSpace } from "@/services/apis/operator/spaces";
import { useUser } from "@/services/hooks/use-user";
import { spaceSchema, type SpaceSchema } from "@/utils/schemas/spaces";
import { generateSlug } from "@/utils/string/slug";
import { queryKeys } from "@/utils/query-keys";
import { days, shortDays } from "@/utils/data/days";
import { spaceCategories } from "@/utils/data/category";
import {
  labelledSpaceGrades,
  labelledSpaceTypes,
} from "@/utils/data/spaceTypes";
import {
  labelledWorkingSizes,
  workingSizes,
  type WorkingSize,
} from "@/utils/data/workingSizes";
import MapsField from "@/components/maps";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import { GroupedSearchSelect } from "@/components/search-select";
import ChippedElements from "@/components/chips";
import ActionButton from "@/components/buttons/action-btn";
import { ArrowLeft } from "lucide-react";
import SelectAmenities from "@/containers/amenities/select-dialog";
import type { Operator } from "@/types/data/operators";
import { validateNumber } from "@/utils/number";
import { getOperators } from "@/services/apis/admin/operators";

const defaultTime = moment().hour(0).minute(0).toDate();

type LocState = {
  operatorData: Operator | null;
};

const SpaceCreatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userLevel, userData } = useUser();

  const isOperatorPortal = userLevel === "operator";
  const loggedInOperator = isOperatorPortal
    ? (userData as Operator | null)
    : null;

  const { operatorData: locationOperatorData } = useMemo(() => {
    const state = location.state as Partial<LocState> | null | undefined;
    return state || {};
  }, [location.state]);

  const [selectedOperatorData, setSelectedOperatorData] =
    useState<Operator | null>(loggedInOperator || locationOperatorData || null);

  const operatorData =
    loggedInOperator || selectedOperatorData || locationOperatorData || null;

  const { amenitiesData } = useAmenities();

  const { data: operatorsRes } = useQuery({
    queryKey: [queryKeys.OPERATORS, "space-create"],
    queryFn: () =>
      getOperators({
        query: {
          page: 1,
          limit: 1000,
          sortBy: "name",
          sortOrder: "asc",
        },
      }),
    enabled: !locationOperatorData && !isOperatorPortal,
  });

  const operators = useMemo(
    () =>
      ((operatorsRes?.data?.data?.results ?? []) as Operator[]).filter(Boolean),
    [operatorsRes?.data?.data?.results],
  );

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
      timing: {
        openDays: days.map((_, i) => i + 1).filter((_, i) => i < 6),
        openingDay: "Monday",
        closingDay: "Saturday",
        openTime: defaultTime,
        closeTime: defaultTime,
        operationalSince: undefined,
      },

      specs: {
        category: "Classic",
        spaceType: "Flex",
        grade: "B",
        area: 0,
        workingSizes: [],
      },

      seats: {
        total: 0,
        booked: 0,
      },

      flags: {
        isActive: true,
        isVerified: false,
        isOc: false,
        isSez: false,
        isVoService: false,
      },

      terms: {
        lockIn: "",
        noticePeriod: "",
        securityDeposit: "",
      },

      pricing: {
        dayPass: 0,
        perSeat: 0,
        dedicatedDesk: 0,
        flexiDesk: 0,
        privateCabin: 0,
        meetingRoom: 0,
        vo: 0,
      },
    },
  });

  const selectedGrade = watch("specs.grade");

  const [POCSameAsOperator, setPOCSameAsOperator] = useState(false);

  useEffect(() => {
    const primaryBranch =
      operatorData?.branches?.find((branch) => branch.isPrimary) ||
      operatorData?.branches?.[0];

    reset({
      ...defaultValues,

      operator: operatorData?.id || defaultValues?.operator,

      branch: primaryBranch?.id || defaultValues?.branch,

      slug: operatorData?.slug
        ? generateSlug(
            operatorData.slug,
            validateNumber(operatorData.totalSpaces, {
              invalidValue: -1,
            }) + 1,
          )
        : defaultValues?.slug,

      person: {
        ...(POCSameAsOperator ? operatorData?.person : defaultValues?.person),
      },
    });
  }, [POCSameAsOperator, operatorData]);

  useEffect(() => {
    if (!selectedGrade) return;

    if (selectedGrade === "A+" || selectedGrade === "A") {
      setValue("flags.isOc", true);
    }

    if (selectedGrade === "B") {
      setValue("flags.isSez", false);
    }
  }, [selectedGrade, setValue]);

  const createSpaceApi = isOperatorPortal
    ? createOperatorSpace
    : createAdminSpace;
  const homeRoute = isOperatorPortal ? "/partner" : "/spaces";

  const { mutateAsync, isPending: createLoading } = useMutation({
    mutationFn: createSpaceApi,
  });

  const onSubmit = async (body: SpaceSchema) => {
    try {
      console.log("Centre body", body);

      const res = await mutateAsync({
        body,
      });

      if (res.status === 201) {
        toast.success("Centre created successfully");
        navigate(homeRoute);
        return;
      }

      throw new Error("Invalid response");
    } catch {
      toast.error("Failed to create centre");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {isOperatorPortal && (
          <ActionButton
            type="button"
            variant="ghost"
            className="mb-2 gap-2 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(homeRoute)}
          >
            <ArrowLeft className="size-4" />
            Back to Portal
          </ActionButton>
        )}
        <div className="flex justify-between items-center my-4">
          <h1 className="text-2xl font-bold  w-full">
            Add Centre: {watch("name", "")}
          </h1>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Space edit form error", errors);
          })}
          className="auto-form-grid"
        >
          {/* SECTION: Centre Details */}

          <FormSectionTitle>Centre Details</FormSectionTitle>
          <FormField
            label="Centre Name"
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
            label="Operator"
            labelPosition="embedded"
            value={operatorData ? operatorData?.name || "None" : undefined}
            readOnly={!!operatorData}
            disabled={!!operatorData}
            error={errors.operator || errors.branch}
          >
            {!operatorData && (
              <GroupedSearchSelect
                type="single"
                items={operators.map((operator) => ({
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
                    operators.find((operator) => operator.id === item.value) ||
                    null;

                  const primaryBranch =
                    selectedOperator?.branches?.find(
                      (branch) => branch.isPrimary,
                    ) || selectedOperator?.branches?.[0];

                  setSelectedOperatorData(selectedOperator);

                  setValue("operator", selectedOperator?.id || "", {
                    shouldValidate: true,
                  });

                  setValue("branch", primaryBranch?.id || "", {
                    shouldValidate: true,
                  });
                }}
              />
            )}
          </FormField>

          <FormField
            key={`space-cat-${defaultValues?.specs?.category}`}
            label="Category"
            labelPosition="embedded"
            inputType="select"
            items={spaceCategories.map((cat) => ({
              label: cat,
              value: cat,
            }))}
            error={errors.specs?.category}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.category,
                onValueChange: (val) =>
                  setValue(
                    "specs.category",
                    val as SpaceSchema["specs"]["category"],
                    {
                      shouldValidate: true,
                    },
                  ),
              },
            }}
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
                onValueChange: (val) =>
                  setValue(
                    "specs.spaceType",
                    val as SpaceSchema["specs"]["spaceType"],
                    {
                      shouldValidate: true,
                    },
                  ),
              },
            }}
            error={errors.specs?.spaceType}
          />

          <FormField
            key={`space-grade-${defaultValues?.specs?.grade}`}
            label="Building Type"
            labelPosition="embedded"
            inputType="select"
            items={labelledSpaceGrades}
            error={errors.specs?.grade}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.grade,
                onValueChange: (val) =>
                  setValue(
                    "specs.grade",
                    val as SpaceSchema["specs"]["grade"],
                    {
                      shouldValidate: true,
                    },
                  ),
              },
            }}
          />

          <FormField
            label="Open Time"
            labelPosition="embedded"
            type="time"
            key={`open-time-${String(defaultValues?.timing?.openTime)}`}
            defaultValue={
              defaultValues?.timing?.openTime
                ? moment(defaultValues.timing.openTime).format("HH:mm")
                : undefined
            }
            onChange={(e) => {
              const val = e.currentTarget.value;

              setValue("timing.openTime", moment(val, "HH:mm", true).toDate(), {
                shouldValidate: true,
              });
            }}
            error={errors.timing?.openTime}
          />

          <FormField
            label="Close Time"
            labelPosition="embedded"
            type="time"
            key={`close-time-${String(defaultValues?.timing?.closeTime)}`}
            defaultValue={
              defaultValues?.timing?.closeTime
                ? moment(defaultValues.timing.closeTime).format("HH:mm")
                : undefined
            }
            onChange={(e) => {
              const val = e.currentTarget.value;

              setValue(
                "timing.closeTime",
                moment(val, "HH:mm", true).toDate(),
                {
                  shouldValidate: true,
                },
              );
            }}
            error={errors.timing?.closeTime}
          />

          <FormField
            label="Total Seats"
            labelPosition="embedded"
            type="number"
            {...register("seats.total", {
              valueAsNumber: true,
            })}
            error={errors.seats?.total}
          />

          <FormField
            label="Available Seats"
            labelPosition="embedded"
            type="number"
            max={watch("seats.total", 0) ?? 0}
            min={0}
            key={`total-${watch("seats.total", 0) ?? 0}`}
            defaultValue={
              (watch("seats.total", 0) ?? 0) - (watch("seats.booked", 0) ?? 0)
            }
            onChange={(e) => {
              const val = Number(e.currentTarget.value);
              const booked = (watch("seats.total", 0) ?? 0) - val;
              setValue("seats.booked", booked, { shouldValidate: true });
            }}
            error={errors.seats?.booked}
          />

          <FormField
            label="Occupancy (%)"
            labelPosition="embedded"
            value={`${
              (watch("seats.total") || 0) > 0
                ? (
                    ((watch("seats.booked") || 0) /
                      (watch("seats.total") || 1)) *
                    100
                  ).toFixed(2)
                : "0.00"
            }%`}
            readOnly
            disabled
          />
          {/* Opening Day */}
          <FormField
            key={`opening-day-${watch("timing.openingDay")}`}
            label="Opening Day"
            labelPosition="embedded"
            inputType="select"
            items={days.map((d) => ({ label: d, value: d }))}
            error={errors.timing?.openingDay}
            pickerProps={{
              wrapperProps: {
                defaultValue: watch("timing.openingDay") || "Monday",
                onValueChange: (val) => {
                  setValue("timing.openingDay", val, {
                    shouldValidate: true,
                  });
                  const closeVal = watch("timing.closingDay") || "Saturday";
                  const startIdx = days.indexOf(val as (typeof days)[number]);
                  const endIdx = days.indexOf(closeVal as (typeof days)[number]);
                  if (startIdx !== -1 && endIdx !== -1) {
                    const range: number[] = [];
                    if (startIdx <= endIdx) {
                      for (let i = startIdx; i <= endIdx; i++) range.push(i + 1);
                    } else {
                      for (let i = startIdx; i < days.length; i++) range.push(i + 1);
                      for (let i = 0; i <= endIdx; i++) range.push(i + 1);
                    }
                    setValue("timing.openDays", range, { shouldValidate: true });
                  }
                },
              },
            }}
          />

          {/* Closing Day */}
          <FormField
            key={`closing-day-${watch("timing.closingDay")}`}
            label="Closing Day"
            labelPosition="embedded"
            inputType="select"
            items={days.map((d) => ({ label: d, value: d }))}
            error={errors.timing?.closingDay}
            pickerProps={{
              wrapperProps: {
                defaultValue: watch("timing.closingDay") || "Saturday",
                onValueChange: (val) => {
                  setValue("timing.closingDay", val, {
                    shouldValidate: true,
                  });
                  const openVal = watch("timing.openingDay") || "Monday";
                  const startIdx = days.indexOf(openVal as (typeof days)[number]);
                  const endIdx = days.indexOf(val as (typeof days)[number]);
                  if (startIdx !== -1 && endIdx !== -1) {
                    const range: number[] = [];
                    if (startIdx <= endIdx) {
                      for (let i = startIdx; i <= endIdx; i++) range.push(i + 1);
                    } else {
                      for (let i = startIdx; i < days.length; i++) range.push(i + 1);
                      for (let i = 0; i <= endIdx; i++) range.push(i + 1);
                    }
                    setValue("timing.openDays", range, { shouldValidate: true });
                  }
                },
              },
            }}
          />

          {/* Open Days */}
          {watch("specs.spaceType", "Flex") !== "MOS" && (
            <FormField
              label="Operational Days"
              labelPosition="embedded"
              error={{
                message: errors.timing?.openDays?.message,
                type: errors.timing?.openDays?.type || "validate",
              }}
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
                      variant="outline"
                      className="min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto"
                    >
                      {watch("timing.openDays", []).length > 0 ? (
                        <ChippedElements
                          elements={watch("timing.openDays", [])
                            .sort((a, b) => a - b)
                            .map((s) => shortDays[s - 1])
                            .filter(Boolean)}
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
                    "timing.openDays",
                    items.filter(
                      (val): val is number => typeof val === "number",
                    ),
                    {
                      shouldValidate: true,
                    },
                  );
                }}
              />
            </FormField>
          )}

          {/* Amenities */}
          <FormField
            label="Amenities"
            labelPosition="embedded"
            error={{
              message:
                errors.facilities?.[0]?.message || errors.facilities?.message,
              type:
                errors.facilities?.[0]?.type ||
                errors.facilities?.type ||
                "validate",
            }}
          >
            <SelectAmenities
              className="grow-1 shrink-1 w-[200px] overflow-hidden overflow-x-auto"
              defaultAmenities={
                defaultValues?.facilities as string[] | undefined
              }
              onSelect={(amenities) => {
                setValue(
                  "facilities",
                  // @ts-ignore
                  amenities.map((a) => a.id),
                  {
                    shouldValidate: true,
                  },
                );
              }}
            >
              {(watch("facilities", [])?.length || 0) > 0 ? (
                <ChippedElements
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
            label="Work Station Sizes"
            labelPosition="embedded"
            error={{
              message:
                errors.specs?.workingSizes?.[0]?.message ||
                errors.specs?.workingSizes?.message,
              type:
                errors.specs?.workingSizes?.[0]?.type ||
                errors.specs?.workingSizes?.type ||
                "validate",
            }}
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
                    variant="outline"
                    className="min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto"
                  >
                    {(watch("specs.workingSizes", [])?.length || 0) > 0 ? (
                      <ChippedElements
                        elements={watch("specs.workingSizes", [])?.map(
                          (s) => `${s} mm`,
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
                  "specs.workingSizes",
                  items.filter(
                    (val): val is WorkingSize => typeof val === "string",
                  ),
                  {
                    shouldValidate: true,
                  },
                );
              }}
            />
          </FormField>

          {/* Operational Since (year) */}
          <FormField
            label="Operational Since (year)"
            labelPosition="embedded"
            placeholder="2024"
            type="number"
            {...register("timing.operationalSince", { valueAsNumber: true })}
            error={errors.timing?.operationalSince}
          />

          {/* Area */}
          <FormField
            label="Centre Area In Sq. Ft. (approx)"
            labelPosition="embedded"
            placeholder="500"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("specs.area", {
              valueAsNumber: true,
            })}
            error={errors.specs?.area}
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
            {...register("pricing.dayPass", { valueAsNumber: true })}
            error={errors.pricing?.dayPass}
          />

          <FormField
            label="Meeting Room"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.meetingRoom", { valueAsNumber: true })}
            error={errors.pricing?.meetingRoom}
          />

          <FormField
            label="Dedicated Desk"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.dedicatedDesk", { valueAsNumber: true })}
            error={errors.pricing?.dedicatedDesk}
          />

          <FormField
            label="Flexi/Hot Desk"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.flexiDesk", { valueAsNumber: true })}
            error={errors.pricing?.flexiDesk}
          />

          <FormField
            label="Per Seat"
            labelPosition="embedded"
            placeholder="300"
            type="number"
            inputMode="decimal"
            min={0}
            {...register("pricing.perSeat", { valueAsNumber: true })}
            error={errors.pricing?.perSeat}
          />

          <FormField
            key={`vo-service-${watch("flags.isVoService")}`}
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
                value: watch("flags.isVoService") ? "true" : "false",
                onValueChange: (val) => {
                  const isYes = val === "true";
                  setValue("flags.isVoService", isYes, {
                    shouldValidate: true,
                  });
                  if (!isYes) {
                    setValue("pricing.vo", 0, { shouldValidate: true });
                  }
                },
              },
            }}
          />

          {watch("flags.isVoService") && (
            <FormField
              label="VO Price Per month"
              labelPosition="embedded"
              placeholder="3000"
              type="number"
              inputMode="decimal"
              min={0}
              {...register("pricing.vo", { valueAsNumber: true })}
              error={errors.pricing?.vo}
            />
          )}

          {/* Terms & Conditions */}
          <FormSectionTitle>Terms & Conditions</FormSectionTitle>
          <FormField
            label="Lock In"
            labelPosition="embedded"
            placeholder="e.g. 1 Year / 6 Months"
            {...register("terms.lockIn")}
            error={errors.terms?.lockIn}
          />
          <FormField
            label="Notice Period"
            labelPosition="embedded"
            placeholder="e.g. 3 Months"
            {...register("terms.noticePeriod")}
            error={errors.terms?.noticePeriod}
          />
          <FormField
            label="Security Deposit"
            labelPosition="embedded"
            placeholder="e.g. 3 Months Rent"
            {...register("terms.securityDeposit")}
            error={errors.terms?.securityDeposit}
          />

          {/* Location */}
          <FormSectionTitle>Location Details</FormSectionTitle>

          <FormField
            label="Location URL"
            labelPosition="embedded"
            placeholder="https://maps.app.goo.gl/..."
            {...register("location.url")}
            error={errors.location?.url}
          />

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
            label="Area - Micro Market"
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
            {...register("location.lat", { valueAsNumber: true })}
            error={errors.location?.lat}
          />

          <FormField
            label="Longitude"
            labelPosition="embedded"
            type="number"
            step="any"
            {...register("location.lng", { valueAsNumber: true })}
            error={errors.location?.lng}
          />

          {/* Maps */}
          <MapsField
            wrapperProps={{ className: "col-span-full flex flex-col gap-4" }}
            mapProps={{ mapContainerClassName: "min-h-[300px] w-full" }}
            buttonProps={{ className: "w-fit" }}
            onGeocodeLatLng={(res, coords) => {
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

              setValue("location", data, {
                shouldValidate: true,
              });
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

          <FormSectionTitle>Point of Contact Details</FormSectionTitle>

          <FormField
            label="Name"
            labelPosition="embedded"
            placeholder="John Doe"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            {...register("person.name")}
            error={errors.person?.name}
          />

          <FormField
            label="Email"
            labelPosition="embedded"
            type="email"
            placeholder="john.doe@example.com"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            {...register("person.email")}
            error={errors.person?.email}
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
            onChange={(val) =>
              setValue("person.contactNo", val?.toString() || "", {
                shouldValidate: true,
              })
            }
            error={errors.person?.contactNo}
          />

          <FormField
            label="Designation"
            placeholder="Centre Manager"
            labelPosition="embedded"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            {...register("person.role")}
            error={errors.person?.role}
          />

          {/* Status */}

          <div className="col-span-full flex gap-8 flex-wrap">
            <div className="flex items-center gap-4">
              <label className="text-muted-foreground text-sm">Active</label>
              <Switch
                key={defaultValues?.flags?.isActive ? "active" : "inactive"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400/60"
                defaultChecked={!!defaultValues?.flags?.isActive}
                {...register("flags.isActive")}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="text-muted-foreground text-sm">Verified</label>
              <Switch
                key={
                  defaultValues?.flags?.isVerified ? "verified" : "unverified"
                }
                defaultChecked={!!defaultValues?.flags?.isVerified}
                {...register("flags.isVerified")}
              />
            </div>

            {selectedGrade === "B" && (
              <div className="flex items-center gap-4">
                <label className="text-muted-foreground text-sm">OC</label>
                <Switch
                  key={defaultValues?.flags?.isOc ? "oc" : "non-oc"}
                  defaultChecked={!!defaultValues?.flags?.isOc}
                  {...register("flags.isOc")}
                />
              </div>
            )}

            {(selectedGrade === "A" || selectedGrade === "A+") && (
              <div className="flex items-center gap-4">
                <label className="text-muted-foreground text-sm">SEZ</label>
                <Switch
                  key={defaultValues?.flags?.isSez ? "sez" : "non-sez"}
                  defaultChecked={!!defaultValues?.flags?.isSez}
                  {...register("flags.isSez")}
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="text-muted-foreground text-sm">
                Same As Operator
              </label>
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
