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
  getBuilderById,
  updateBuilder,
} from "@/services/apis/admin/conventional";
import { queryKeys } from "@/utils/query-keys";
import { builderSchema, type BuilderSchema } from "@/utils/schemas/builder";

type BuilderEditSchema = Omit<BuilderSchema, "password">;

export default function BuilderEditPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, defaultValues },
  } = useForm<BuilderEditSchema>({
    resolver: zodResolver(builderSchema.omit({ password: true })),
    defaultValues: { isActive: true },
  });

  const { data: res, isFetching } = useQuery({
    queryKey: [queryKeys.BUILDERS, id],
    queryFn: () => getBuilderById({ url: id }),
    enabled: !!id,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: [queryKeys.BUILDERS, "update", id],
    mutationFn: (body: BuilderEditSchema) => updateBuilder({ url: id, body }),
  });

  useEffect(() => {
    if (res?.data?.data) {
      reset({
        isActive: true,
        ...res.data.data,
      });
    }
  }, [res?.data?.data, reset]);

  const onSubmit = async (body: BuilderEditSchema) => {
    try {
      const updateRes = await mutateAsync(body);
      if (updateRes.status === 200) {
        toast.success("Builder updated successfully");
        navigate("/conventional");
        return;
      }
      throw new Error("Invalid response");
    } catch {
      toast.error("Failed to update builder");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="my-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{watch("name", "")}</h1>
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Builder form err", errors);
          })}
          className="auto-form-grid"
        >
          <FormSectionTitle>Builder Details</FormSectionTitle>

          <FormField
            label="Builder Name"
            labelPosition="embedded"
            placeholder="Builder name"
            {...register("name")}
            error={errors.name}
          />
          <FormField
            label="Brand Name"
            labelPosition="embedded"
            placeholder="Brand name"
            {...register("brandName")}
            error={errors.brandName}
          />
          <FormField
            label="Slug"
            labelPosition="embedded"
            placeholder="builder-slug"
            {...register("slug")}
            error={errors.slug}
          />
          <FormField
            label="Email"
            labelPosition="embedded"
            type="email"
            placeholder="builder@example.com"
            {...register("email")}
            error={errors.email}
          />
          <FormField
            label="GST Number"
            labelPosition="embedded"
            placeholder="GST number"
            {...register("gstNo")}
            error={errors.gstNo}
          />
          <FormField
            label="CIN/LLPIN"
            labelPosition="embedded"
            placeholder="CIN/LLPIN number"
            {...register("cinNo")}
            error={errors.cinNo}
          />

          <FormSectionTitle>Headquarter</FormSectionTitle>

          <FormField
            label="HQ Address"
            labelPosition="embedded"
            inputType="textarea"
            placeholder="Headquarter address"
            {...register("headquarter.address")}
            error={errors.headquarter?.address}
          />
          <FormField
            key={`hq-contact-${defaultValues?.headquarter?.contactNo}`}
            label="HQ Contact No"
            labelPosition="embedded"
            inputType="phone"
            defaultValue={defaultValues?.headquarter?.contactNo}
            placeholder="+91 98765 43210"
            error={errors.headquarter?.contactNo}
            onChange={(value) => {
              setValue("headquarter.contactNo", value?.toString() || "", {
                shouldValidate: true,
              });
            }}
          />

          <div className="col-span-full flex justify-end">
            <div className="flex items-center gap-4">
              <label className="text-sm text-muted-foreground">Active Builder</label>
              <Switch
                key={defaultValues?.isActive ? "active" : "inactive"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
                defaultChecked={!!defaultValues?.isActive}
                onCheckedChange={(checked) => {
                  setValue("isActive", checked, { shouldValidate: true });
                }}
              />
            </div>
          </div>

          <div className="col-span-full mt-6 flex justify-end">
            <ActionButton
              type="submit"
              loading={isPending || isFetching}
              className="max-w-fit"
            >
              Update Builder
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
