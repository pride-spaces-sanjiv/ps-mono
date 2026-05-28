import { useEffect, useRef, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
// Utils
// Apis
import {
  getOperatorPassword,
  updateOperatorPassword,
} from "@/services/apis/admin/operators";
// Schemas
import { operatorSchema, type OperatorSchema } from "@/utils/schemas/operators";
import { queryKeys } from "@/utils/query-keys";
import { DialogModal } from "@/components/dialog";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import { handleAxiosErrorCases } from "@/utils/axios/error";

type Props = {
  dialogModalProps: ComponentProps<typeof DialogModal>;
  triggerBtnProps: ComponentProps<typeof ActionButton>;
  id: string;
};

export default function OperatorChangePasswordDialog({
  dialogModalProps,
  triggerBtnProps,
  id = "",
}: Partial<Props>) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues, isValid },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(operatorSchema.pick({ password: true })),
  });

  const {
    data: passwordRes,
    isFetching,
    refetch: refetchPassword,
  } = useQuery({
    queryKey: [queryKeys.OPERATORS, "password", id],
    queryFn: () => getOperatorPassword({ url: id }),
  });

  const { mutateAsync: updateMutater, isPending: isUpdating } = useMutation({
    mutationKey: [queryKeys.OPERATORS, "password", id],
    mutationFn: (body: Pick<OperatorSchema, "password">) =>
      updateOperatorPassword({ url: id, body: body }),
  });

  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const updatePassword = async (body: Pick<OperatorSchema, "password">) => {
    try {
      const res = await updateMutater(body);
      if (res.status === 200) {
        toast.success("Password changed successfully");
        refetchPassword?.();
        dialogRef.current?.click?.();
        return;
      }
      throw new Error("invalid response");
    } catch (err) {
      console.error("Error password change :", err);

      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof updateOperatorPassword>>["data"]
      >(err, [
        {
          status: 400,
          handler: (res) => {
            const errorType = res?.data.errorType?.toLowerCase().trim();
            if (
              errorType?.includes("password") &&
              errorType.includes("matched")
            ) {
              toast.error("New and old passwords must be different");
            }
          },
        },
      ]);
      if (handled) {
        return;
      }
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
      {...dialogModalProps}
      titleProps={{
        children: "Change Password",
        ...dialogModalProps?.titleProps,
      }}
      descriptionProps={{
        children: "Edit your password and save it",
        ...dialogModalProps?.descriptionProps,
      }}
      closeProps={{ ref: dialogRef, ...dialogModalProps?.closeProps }}
      triggerProps={{
        children: (
          <ActionButton variant={"secondary"} {...triggerBtnProps}>
            {triggerBtnProps?.children || "Change Password"}
          </ActionButton>
        ),
        ...dialogModalProps?.triggerProps,
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
