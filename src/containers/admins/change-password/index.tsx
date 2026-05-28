import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
// Utils
import {
  changeAdminPassword,
  getAdminPassword,
} from "@/services/apis/admin/admins";
import { adminSchema, type AdminSchema } from "@/utils/schemas/user";
import { queryKeys } from "@/utils/query-keys";
import { DialogModal } from "@/components/dialog";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";

export default function AdminChangePasswordDialog() {
  const { id = "" } = useParams();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues, isValid },
    watch,
    setValue,
  } = useForm({ resolver: zodResolver(adminSchema.pick({ password: true })) });

  const { data: passwordRes, isFetching } = useQuery({
    queryKey: [queryKeys.ADMINS, "password", id],
    queryFn: () => getAdminPassword({ url: id }),
  });

  const { mutateAsync: updateMutater, isPending: isUpdating } = useMutation({
    mutationKey: [queryKeys.ADMINS, "password", id],
    mutationFn: (body: Pick<AdminSchema, "password">) =>
      changeAdminPassword({ url: id, body: body }),
  });

  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const updatePassword = async (body: Pick<AdminSchema, "password">) => {
    try {
      const res = await updateMutater(body);
      if (res.status === 200) {
        toast.success("Password changed successfully");
        dialogRef.current?.click?.();
        return;
      }
      throw new Error("invalid response");
    } catch (err) {
      console.error("Error password change :", err);
      toast.error("Failed to change password");
    }
  };

  useEffect(() => {
    if (passwordRes?.data?.data?.decodedPassword?.trim()) {
      reset({
        ...defaultValues,
        password: passwordRes.data.data.decodedPassword,
      });
    }
  }, [passwordRes?.data]);

  return (
    <DialogModal
      titleProps={{ children: "Change Password" }}
      descriptionProps={{ children: "Edit your password and save it" }}
      closeProps={{ ref: dialogRef }}
      triggerProps={{
        children: (
          <ActionButton variant={"secondary"}>Change Password</ActionButton>
        ),
      }}
    >
      <div className="flex flex-col gap-3">
        <FormField
          label="Password"
          inputType="password"
          placeholder="••••••••"
          defaultValue={defaultValues?.password}
          onChange={(e) => {
            const val = e.currentTarget.value;
            setValue("password", val, { shouldValidate: true });
          }}
          error={errors.password}
        />
        <ActionButton
          type="button"
          loading={isUpdating || isFetching}
          className="self-end w-fit"
          onClick={() => {
            isValid && updatePassword(watch());
          }}
        >
          Update Password
        </ActionButton>
      </div>
    </DialogModal>
  );
}
