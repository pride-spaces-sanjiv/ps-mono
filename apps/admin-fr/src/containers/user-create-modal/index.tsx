import React, { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import { number, object } from "yup";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { DialogClose } from "@radix-ui/react-dialog";
import { Plus, Trash2 } from "lucide-react";
// import { userStore } from "@/services/store/user";
import { useAutoMediaDataFetch } from "@/services/hooks/useAutoMediaData";
import { useUser } from "@/services/hooks/use-user";
import { createUser } from "@/services/apis/users";
import { queryClient } from "@/App";
// import { createUserSchema, type CreateUserSchema } from "@/utils/schemas/user";
import { queryKeys } from "@/utils/query-keys";
import { validateNumber } from "@/utils/number";
import { deleteFields } from "@/utils/object/field";
import { userLevelsData } from "@/utils/data/users";
import { DialogModal } from "@/components/dialog";
import { DatePicker } from "@/components/date-picker";
import { SelectPicker } from "@/components/select";
import GroupsSelectPicker from "@/components/groups-selector";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";

const UserModal = () => {
  const {
    mutateAsync: createMutater,
    isPending: createLoading,
    data: createRes,
    error: createError,
    isError: iscreateError,
  } = useMutation({
    mutationKey: [`${queryKeys.USERDATA}-create`],
    // @ts-ignore
    mutationFn: (body: CreateUserSchema) => createUser({ body: body }),
  });

  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const { userStoreState, refetch: selfRefetch } = useUser({});
  const userData = userStoreState.value;
  const currentUserLevel = validateNumber(userData?.level, { invalidValue: 0 });

  const {} = useAutoMediaDataFetch();

  const {
    reset,
    register,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, defaultValues },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(
      createUserSchema.concat(
        object().shape({
          expiryMonths: number()
            .optional()
            .min(1, "Must be atleast 1 month")
            .integer("Must be an integer"),
        })
      )
    ),
    defaultValues: {
      credits: 0,
      level: 0,
    },
  });
  const userLevel = useMemo(
    () => validateNumber(watch("level", 0), { invalidValue: 0 }),
    [watch("level")]
  );

  const handleCreate = async (
    body: CreateUserSchema & { expiryMonths?: number }
  ) => {
    try {
      console.log(body, "body");
      const cleaned = deleteFields(body, [
        // "expiryMonths",
        // ...(body.level !== 0 ? [] : (["enabledGroups"] as const)),
        // ...(body.level === 0 ? (["loginPassword"] as const) : []),
        ...(currentUserLevel === 1
          ? (["credits", "email", "expiry", "level"] as const)
          : []),
      ]);
      const res = await createMutater(cleaned as typeof body);
      const data = res.data?.data;
      if ((res.status === 200 || res.status === 201) && data?.id) {
        dialogRef.current?.click();
        toast.success("User Created Successfully!");
        reset();
        // @ts-ignore
        queryClient.refetchQueries([queryKeys.USERS]);
        selfRefetch();

        return;
      }
      throw new Error("Invalid Response");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create user");
    }
  };

  useEffect(() => {
    if (userLevel === 0) {
      setValue("loginPassword", "No-login@123", { shouldValidate: true });
      setValue("credits", 0, { shouldValidate: true });
      return;
    }
    if (userLevel > 0) {
      setValue("loginPassword", watch("loginPassword", undefined), {
        shouldValidate: true,
      });
      setValue("credits", watch("credits", 0), { shouldValidate: true });
    }
  }, [userLevel]);

  return (
    <DialogModal
      triggerProps={{
        children: (
          <ActionButton variant={"default"} loading={createLoading}>
            <div className="flex gap-2 items-center">
              <Plus /> Create User
            </div>
          </ActionButton>
        ),
      }}
      contentProps={{ className: "w-[700px] sm:max-w-[calc(100%-2rem)]" }}
      titleProps={{
        children: "Create new user",
      }}
      descriptionProps={{
        children: "Fill the fields and save to create a new acount.",
      }}
      footerProps={{
        children: (
          <>
            <DialogClose ref={dialogRef} />
          </>
        ),
      }}
    >
      <form
        onSubmit={handleSubmit(handleCreate, (errors) => {
          console.log(errors);
        })}
        className=""
      >
        <div className="auto-form-grid pb-4">
          <FormField
            label={"Name"}
            required
            {...register("name")}
            error={errors.name}
          />
          {userLevel >= 1 && (
            <FormField
              label={"Email"}
              {...register("email")}
              required
              error={errors.email}
            />
          )}

          {userLevel >= 1 && (
            <FormField
              label={"Password"}
              inputType="password"
              defaultValue={defaultValues?.loginPassword}
              {...register("loginPassword")}
              required
              error={errors?.loginPassword}
            />
          )}

          {/* Select user level, if self admin */}
          {currentUserLevel >= 2 && (
            <FormField
              label={"Account Type"}
              required
              key={`level-def-${defaultValues?.level}`}
            >
              <SelectPicker
                className="min-h-[40px] h-auto w-full"
                wrapperProps={{
                  defaultValue: (defaultValues?.level || 0).toString(),
                  onValueChange: (val) => {
                    const value = Number(val);
                    console.log(value);
                    setValue(
                      "level",
                      // @ts-ignore
                      Number.isFinite(value) ? value : undefined,
                      { shouldValidate: true }
                    );
                  },
                }}
                items={userLevelsData.filter((_, i) => currentUserLevel > i)}
                valueProps={{ placeholder: "Select account type" }}
                showSeparator={false}
                showLabel={false}
              />
            </FormField>
          )}

          {/* If self reseller and user customer, select months to expire with credits checkup */}
          {watch("level", 0) === 0 && currentUserLevel === 1 && (
            <FormField
              label={"Extend Expiry Months"}
              type="number"
              inputMode="numeric"
              onChange={(e) => {
                clearErrors("expiryMonths");
                const val = validateNumber(e.currentTarget.value, {
                  invalidValue: 0,
                });

                // Need integer
                if (!Number.isInteger(val)) {
                  return setError("expiryMonths", {
                    message: "Must be integer only",
                  });
                }
                // Must be >= credits
                if (
                  validateNumber(userData?.credits, {
                    invalidValue: 0,
                  }) === 0 ||
                  val >
                    validateNumber(userData?.credits, {
                      invalidValue: 0,
                    })
                ) {
                  return setError("expiryMonths", {
                    message: "Insufficient Credits",
                  });
                }
                setValue("expiryMonths", val, { shouldValidate: true });
              }}
              error={errors.expiryMonths}
            ></FormField>
          )}
          {/* If self admin and user customer, select date to expire */}
          {userLevel === 0 && currentUserLevel >= 2 && (
            <FormField label={"Select Expiry"} error={errors.expiry}>
              <DatePicker
                className="min-h-[40px] h-auto"
                buttonProps={{ className: "w-full" }}
                endMonth={moment().add(12, "months").toDate()}
                disabled={(date) =>
                  moment(date).isBefore(new Date().setHours(0, 0, 0, 0))
                }
                onSelect={(date) => {
                  setValue(
                    "expiry",
                    moment(date)
                      .hours(0)
                      .minutes(0)
                      .seconds(0)
                      .milliseconds(0)
                      .toDate(),
                    { shouldValidate: true }
                  );
                }}
              />
            </FormField>
          )}
          {/* Groups selection for only customer */}
          {userLevel === 0 && (
            <FormField
              label={"Select Groups"}
              required
              // @ts-ignore
              error={errors.enabledGroups}
            >
              <GroupsSelectPicker
                onSelect={(groups) => {
                  setValue("enabledGroups", groups || [], {
                    shouldValidate: true,
                  });
                }}
              />
            </FormField>
          )}
          {/* If self admin, can update reseller credits */}
          {userLevel === 1 && currentUserLevel >= 2 && (
            <FormField
              label={"Credits"}
              type={"number"}
              min={0}
              max={999999}
              defaultValue={defaultValues?.credits}
              {...register("credits")}
              required
              inputMode="numeric"
              error={errors?.credits}
            />
          )}
          <FormField
            label={"Phone Number"}
            type={"tel"}
            required={watch("level") === 1}
            min={1}
            max={9999999999}
            {...register("phone")}
            inputMode="tel"
            error={
              errors?.phone
                ? { ...errors.phone, message: "Invalid phone number" }
                : undefined
            }
          />
          {/* Account status only for customer */}
          {userLevel === 0 && (
            <FormField
              label={"Account Status"}
              required
              key={`status-def-${defaultValues?.isActive}`}
            >
              <SelectPicker
                className="min-h-[40px] h-auto w-full"
                wrapperProps={{
                  defaultValue: defaultValues?.isActive ? "active" : "inactive",
                  onValueChange: (val) => {
                    setValue("isActive", val === "active", {
                      shouldValidate: true,
                    });
                  },
                }}
                items={["Active", "Inactive"].map((s, i) => ({
                  label: s,
                  value: s.toLowerCase().trim(),
                }))}
                valueProps={{ placeholder: "Select account status" }}
                showSeparator={false}
                showLabel={false}
              />
            </FormField>
          )}
        </div>
        <ActionButton
          type="submit"
          loading={createLoading}
          className="w-fit ml-auto"
          // onClick={() => console.log("clicked")}
        >
          Create User
        </ActionButton>
      </form>
    </DialogModal>
  );
};

export default UserModal;
