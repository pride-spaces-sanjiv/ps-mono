import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@/services/hooks/use-user";
import { adminSchema, type AdminSchema } from "@/utils/schemas/user";
import { createAdmin } from "@/services/apis/admin/admins";
import { getAdminLowerLevels } from "@/utils/data/admin";
import { generatePassword } from "@/utils/string/password";
import { queryKeys } from "@/utils/query-keys";
import FormSectionTitle from "@/components/form/section/title";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";

const AdminCreatePage = () => {
  const navigate = useNavigate();

  const { userLevel } = useUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: { password: generatePassword() },
  });

  const { mutateAsync, isPending: createLoading } = useMutation({
    mutationFn: createAdmin,
  });

  const onSubmit = async (body: AdminSchema) => {
    try {
      console.log("Admin body", body);
      const res = await mutateAsync({
        body,
      });

      if (res.status === 201) {
        toast.success("Added new team member");
        navigate("/team");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to add member");
    }
  };

  const levels = useMemo(
    () => (userLevel ? getAdminLowerLevels(userLevel as any) : []),
    [userLevel],
  );
  console.log(levels, userLevel);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">{watch("name", "")}</h1>
      </div>
      <div className="w-full max-w-4xl mx-auto py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Admin form err", errors);
          })}
          className="auto-form-grid"
        >
          {/* SECTION: Admin Details */}

          <FormSectionTitle>Operator Details</FormSectionTitle>

          <FormField
            label="Name"
            placeholder="Tester QA"
            labelPosition="embedded"
            {...register("name")}
            error={errors.name}
          />

          <FormField
            label="Email"
            labelPosition="embedded"
            type="email"
            placeholder="support@example.com"
            {...register("email")}
            error={errors.email}
          />

          <FormField
            label="Password"
            labelPosition="embedded"
            inputType="password"
            placeholder="••••••••"
            {...register("password")}
            error={errors.password}
          />

          <FormField
            key={`ph-${defaultValues?.phone}`}
            label="Phone No"
            labelPosition="embedded"
            type="tel"
            inputMode="tel"
            inputType="phone"
            defaultValue={defaultValues?.phone}
            value={watch("phone")}
            placeholder="+1-123-456-7890"
            onChange={(val) => {
              console.log(val);
              setValue("phone", val?.toString() || "", {
                shouldValidate: true,
              });
            }}
            error={errors?.phone}
          />

          <FormField
            key={`level-${levels.length}`}
            label="Member Type"
            labelPosition="embedded"
            inputType="select"
            defaultValue={defaultValues?.level}
            items={levels.map((s) => ({
              label: s[0].toUpperCase() + s.slice(1).toLowerCase(),
              value: s,
            }))}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.level,
                onValueChange: (val) => {
                  setValue("level", val as any, {
                    shouldValidate: true,
                  });
                },
              },
            }}
          />

          {/* Submit */}

          <div className="col-span-full mt-6 flex justify-end">
            <ActionButton
              type="submit"
              loading={createLoading}
              className="max-w-fit"
            >
              Add Member
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreatePage;
