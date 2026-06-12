import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import ActionButton from "@/components/buttons/action-btn";
import {
  getConventionalPropertyById,
  updateConventionalProperty,
} from "@/services/apis/admin/conventional";
import { queryKeys } from "@/utils/query-keys";
import {
  conventionalPropertySchema,
  type ConventionalPropertySchema,
} from "@/utils/schemas/conventional";
import {
  dealStatuses,
  esgScores,
  furnishStatuses,
  greenCerts,
  occupancyStatuses,
  ownershipTypes,
  sources,
} from "@/utils/data/conventional";
import { spaceGrades } from "@/utils/data/spaceTypes";

export default function LandlordEditPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, defaultValues },
  } = useForm({
    resolver: zodResolver(conventionalPropertySchema),
    defaultValues: {
      canImmediateAvail: false,
      grade: "B",
      isActive: true,
      isSez: false,
    },
  });

  const { data: res, isFetching } = useQuery({
    queryKey: [queryKeys.CONVENTIONAL, id],
    queryFn: () => getConventionalPropertyById({ url: id }),
    enabled: !!id,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: [queryKeys.CONVENTIONAL, "update", id],
    mutationFn: (body: ConventionalPropertySchema) =>
      updateConventionalProperty({ url: id, body }),
  });

  useEffect(() => {
    if (res?.data?.data) {
      reset({
        canImmediateAvail: false,
        grade: "B",
        isActive: true,
        isSez: false,
        ...res.data.data,
      });
    }
  }, [res?.data?.data, reset]);

  const onSubmit = async (body: ConventionalPropertySchema) => {
    try {
      const updateRes = await mutateAsync(body);
      if (updateRes.status === 200) {
        toast.success("Landlord data updated successfully");
        navigate("/conventional");
        return;
      }
      throw new Error("Invalid response");
    } catch {
      toast.error("Failed to update landlord data");
    }
  };

  const selectItems = (items: readonly string[]) =>
    items.map((value) => ({ label: value, value }));

  return (
    <div className="container mx-auto p-6">
      <div className="my-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{watch("name", "")}</h1>
      </div>
      <div className="mx-auto w-full max-w-5xl py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Landlord form err", errors);
          })}
          className="auto-form-grid"
        >
          <FormSectionTitle>Landlord Details</FormSectionTitle>

          <FormField
            label="Name"
            labelPosition="embedded"
            placeholder="Property name"
            {...register("name")}
            error={errors.name}
          />
          <FormField
            label="Slug"
            labelPosition="embedded"
            placeholder="property-slug"
            {...register("slug")}
            error={errors.slug}
          />
          <FormField
            label="Developer Id"
            labelPosition="embedded"
            placeholder="Developer id"
            {...register("developer")}
            error={errors.developer}
          />
          <FormField
            label="Type"
            labelPosition="embedded"
            placeholder="Commercial"
            {...register("type")}
            error={errors.type}
          />
          <FormField
            label="Completion Year"
            labelPosition="embedded"
            type="number"
            {...register("completionYear", { valueAsNumber: true })}
            error={errors.completionYear}
          />
          <FormField
            label="Grade"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.grade}
            items={selectItems(spaceGrades)}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.grade,
                onValueChange: (value) =>
                  setValue("grade", value as any, { shouldValidate: true }),
              },
            }}
            error={errors.grade}
          />

          <FormSectionTitle>Location</FormSectionTitle>

          <FormField
            label="Address"
            labelPosition="embedded"
            inputType="textarea"
            placeholder="Address"
            {...register("location.address")}
            error={errors.location?.address}
          />
          <FormField
            label="Area"
            labelPosition="embedded"
            placeholder="Area"
            {...register("location.area")}
            error={errors.location?.area}
          />
          <FormField
            label="City"
            labelPosition="embedded"
            placeholder="City"
            {...register("location.city")}
            error={errors.location?.city}
          />
          <FormField
            label="State"
            labelPosition="embedded"
            placeholder="State"
            {...register("location.state")}
            error={errors.location?.state}
          />
          <FormField
            label="Country"
            labelPosition="embedded"
            placeholder="Country"
            {...register("location.country")}
            error={errors.location?.country}
          />
          <FormField
            label="Postal Code"
            labelPosition="embedded"
            placeholder="Postal code"
            {...register("location.postalCode")}
            error={errors.location?.postalCode}
          />
          <FormField
            label="Landmark"
            labelPosition="embedded"
            placeholder="Landmark"
            {...register("location.landmark")}
            error={errors.location?.landmark}
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

          <FormSectionTitle>Area & Pricing</FormSectionTitle>

          <FormField
            label="Available Area"
            labelPosition="embedded"
            type="number"
            {...register("area.availableArea", { valueAsNumber: true })}
            error={errors.area?.availableArea}
          />
          <FormField
            label="Total Built Area"
            labelPosition="embedded"
            type="number"
            {...register("area.totalBuiltArea", { valueAsNumber: true })}
            error={errors.area?.totalBuiltArea}
          />
          <FormField
            label="Total Leased Area"
            labelPosition="embedded"
            type="number"
            {...register("area.totalLeasedArea", { valueAsNumber: true })}
            error={errors.area?.totalLeasedArea}
          />
          <FormField
            label="Floor Plate Size"
            labelPosition="embedded"
            type="number"
            {...register("area.floorPlateSize", { valueAsNumber: true })}
            error={errors.area?.floorPlateSize}
          />
          <FormField
            label="Rent"
            labelPosition="embedded"
            type="number"
            {...register("pricing.rent", { valueAsNumber: true })}
            error={errors.pricing?.rent}
          />
          <FormField
            label="CAM Charge"
            labelPosition="embedded"
            type="number"
            {...register("pricing.camCharge", { valueAsNumber: true })}
            error={errors.pricing?.camCharge}
          />
          <FormField
            label="Deposit Months"
            labelPosition="embedded"
            type="number"
            {...register("pricing.depositMonths", { valueAsNumber: true })}
            error={errors.pricing?.depositMonths}
          />
          <FormField
            label="Escalation"
            labelPosition="embedded"
            type="number"
            {...register("pricing.escalation", { valueAsNumber: true })}
            error={errors.pricing?.escalation}
          />

          <FormSectionTitle>Specs</FormSectionTitle>

          <FormField
            label="Ownership Type"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.specs?.ownershipType}
            items={selectItems(ownershipTypes)}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.ownershipType,
                onValueChange: (value) =>
                  setValue("specs.ownershipType", value as any, {
                    shouldValidate: true,
                  }),
              },
            }}
            error={errors.specs?.ownershipType}
          />
          <FormField
            label="Occupancy Status"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.specs?.occupancyStatus}
            items={selectItems(occupancyStatuses)}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.occupancyStatus,
                onValueChange: (value) =>
                  setValue("specs.occupancyStatus", value as any, {
                    shouldValidate: true,
                  }),
              },
            }}
            error={errors.specs?.occupancyStatus}
          />
          <FormField
            label="Furnish Status"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.specs?.furnishStatus}
            items={selectItems(furnishStatuses)}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.furnishStatus,
                onValueChange: (value) =>
                  setValue("specs.furnishStatus", value as any, {
                    shouldValidate: true,
                  }),
              },
            }}
            error={errors.specs?.furnishStatus}
          />
          <FormField
            label="Green Cert"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.specs?.greenCert}
            items={selectItems(greenCerts)}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.greenCert,
                onValueChange: (value) =>
                  setValue("specs.greenCert", value as any, {
                    shouldValidate: true,
                  }),
              },
            }}
            error={errors.specs?.greenCert}
          />
          <FormField
            label="Source"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.specs?.source}
            items={selectItems(sources)}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.source,
                onValueChange: (value) =>
                  setValue("specs.source", value as any, {
                    shouldValidate: true,
                  }),
              },
            }}
            error={errors.specs?.source}
          />
          <FormField
            label="Deal Status"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.specs?.dealStatus}
            items={selectItems(dealStatuses)}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.dealStatus,
                onValueChange: (value) =>
                  setValue("specs.dealStatus", value as any, {
                    shouldValidate: true,
                  }),
              },
            }}
            error={errors.specs?.dealStatus}
          />
          <FormField
            label="ESG Score"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.specs?.esgScore}
            items={selectItems(esgScores)}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.esgScore,
                onValueChange: (value) =>
                  setValue("specs.esgScore", value as any, {
                    shouldValidate: true,
                  }),
              },
            }}
            error={errors.specs?.esgScore}
          />
          <FormField
            label="HVAC Type"
            labelPosition="embedded"
            placeholder="HVAC type"
            {...register("specs.hvacType")}
            error={errors.specs?.hvacType}
          />
          <FormField
            label="Power Backup"
            labelPosition="embedded"
            type="number"
            {...register("specs.powerBackup", { valueAsNumber: true })}
            error={errors.specs?.powerBackup}
          />
          <FormField
            label="Lift Count"
            labelPosition="embedded"
            type="number"
            {...register("specs.liftCount", { valueAsNumber: true })}
            error={errors.specs?.liftCount}
          />

          <FormSectionTitle>Contact</FormSectionTitle>

          <FormField
            label="POC Name"
            labelPosition="embedded"
            placeholder="Contact person"
            {...register("person.name")}
            error={errors.person?.name}
          />
          <FormField
            label="POC Email"
            labelPosition="embedded"
            type="email"
            placeholder="person@example.com"
            {...register("person.email")}
            error={errors.person?.email}
          />
          <FormField
            key={`poc-contact-${defaultValues?.person?.contactNo}`}
            label="POC Contact No"
            labelPosition="embedded"
            inputType="phone"
            defaultValue={defaultValues?.person?.contactNo}
            placeholder="+91 98765 43210"
            error={errors.person?.contactNo}
            onChange={(value) => {
              setValue("person.contactNo", value?.toString() || "", {
                shouldValidate: true,
              });
            }}
          />
          <FormField
            label="POC Role"
            labelPosition="embedded"
            placeholder="Role"
            {...register("person.role")}
            error={errors.person?.role}
          />
          <FormField
            label="GST Number"
            labelPosition="embedded"
            placeholder="GST number"
            {...register("gstNo")}
            error={errors.gstNo}
          />

          <div className="col-span-full flex flex-wrap justify-end gap-8">
            <div className="flex items-center gap-4">
              <label className="text-sm text-white">Immediate Available</label>
              <Switch
                key={
                  defaultValues?.canImmediateAvail
                    ? "immediate"
                    : "not-immediate"
                }
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
                defaultChecked={!!defaultValues?.canImmediateAvail}
                onCheckedChange={(checked) =>
                  setValue("canImmediateAvail", checked, {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm text-white">SEZ</label>
              <Switch
                key={defaultValues?.isSez ? "sez" : "not-sez"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
                defaultChecked={!!defaultValues?.isSez}
                onCheckedChange={(checked) =>
                  setValue("isSez", checked, { shouldValidate: true })
                }
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm text-white">Active</label>
              <Switch
                key={defaultValues?.isActive ? "active" : "inactive"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
                defaultChecked={!!defaultValues?.isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked, { shouldValidate: true })
                }
              />
            </div>
          </div>

          <div className="col-span-full mt-6 flex justify-end">
            <ActionButton
              type="submit"
              loading={isPending || isFetching}
              className="max-w-fit"
            >
              Update Landlord
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
