import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// Services
// Hooks
import { useUser } from "@/services/hooks/use-user";
// APis
import {
  updateAdmin,
  getAdmin,
  getAdminPassword,
  changeAdminPassword,
} from "@/services/apis/admin/admins";

// Utils
import { adminSchema, type AdminSchema } from "@/utils/schemas/user";
import { datifyObjectValues } from "@/utils/object/datify";

// Data
import { getAdminLowerLevels } from "@/utils/data/admin";
import { queryKeys } from "@/utils/query-keys";

// Components
import ChangePasswordDialog from "@/containers/admins/change-password";
import FormSectionTitle from "@/components/form/section/title";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";

// Types

export default function EditAdmin() {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const { userLevel } = useUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(adminSchema.omit({ password: true })),
  });

  const { data: res, isFetching } = useQuery({
    queryKey: [queryKeys.ADMINS, "update", id],
    // queryKey: [queryKeys.ADMIN, "update", id],
    queryFn: () => getAdmin({ url: id }),
  });

  const { mutateAsync, isPending: isUpdating } = useMutation({
    mutationKey: [queryKeys, "update", id],
    // mutationKey: [queryKeys.ADMIN, "update", id],
    mutationFn: (body: Omit<AdminSchema, "password">) =>
      updateAdmin({ url: id, body }),
  });

  const onSubmit = async (body: Omit<AdminSchema, "password">) => {
    try {
      const res = await mutateAsync(body);

      if (res.status === 200) {
        toast.success("Admin updated successfully");
        navigate("/team");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to update admin");
    }
  };

  useEffect(() => {
    if (res?.data?.data) {
      const modified = datifyObjectValues(res.data.data, [
        "createdAt",
        "updatedAt",
      ]);

      reset({
        ...defaultValues,
        ...modified,
      });
    }
  }, [res?.data]);

  const levels = useMemo(
    () => (userLevel ? getAdminLowerLevels(userLevel as any) : []),
    [userLevel],
  );

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
          {/* SECTION */}
          <FormSectionTitle>Edit Member</FormSectionTitle>

          {/* Name */}
          <FormField
            label="Name"
            placeholder="Tester QA"
            labelPosition="embedded"
            {...register("name")}
            error={errors.name}
          />

          {/* Email */}
          <FormField
            label="Email"
            labelPosition="embedded"
            type="email"
            placeholder="support@example.com"
            {...register("email")}
            error={errors.email}
          />

          {/* Username */}
          <FormField
            label="Username"
            labelPosition="embedded"
            placeholder="john_doe"
            {...register("username")}
            error={errors.username}
          />

          {/* Phone */}
          <FormField
            key={`ph-${defaultValues?.phone}`}
            label="Phone No"
            labelPosition="embedded"
            type="tel"
            inputMode="tel"
            inputType="phone"
            // defaultValue={watch("phone")}
            value={watch("phone")}
            placeholder="+1-123-456-7890"
            onChange={(val) => {
              setValue("phone", val?.toString() || "", {
                shouldValidate: true,
              });
            }}
            error={errors?.phone}
          />

          {/* Level */}
          <FormField
            key={`level-${levels.length}-${userLevel}-def-${defaultValues?.level}`}
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

          {!!userLevel && userLevel === "super-admin" && (
            <ChangePasswordDialog />
          )}

          {/* Submit */}
          <div className="col-span-full mt-6 flex justify-end">
            <ActionButton
              type="submit"
              loading={isUpdating || isFetching}
              className="max-w-fit"
            >
              Update Member
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
