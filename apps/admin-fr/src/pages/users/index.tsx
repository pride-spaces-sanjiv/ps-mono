import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { number, object } from "yup";
import moment from "moment";
import Skeleton from "react-loading-skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DialogClose } from "@/components/ui/dialog";
import { ExternalLink, Link } from "lucide-react";
// import { userStore } from "@/services/store/user";
import { useUser } from "@/services/hooks/use-user";
import {
  updateUser,
  getUserData,
  deleteUser,
  generateShortLinkForUser,
} from "@/services/apis/users";
import { getUserPassword, updateUserPassword } from "@/services/apis/admin";
import {
  passwordUserChangeSchema,
  userSchema,
  type PasswordUserChangeSchema,
  type UserSchema,
} from "@/utils/schemas/user";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { datifyObjectValues } from "@/utils/object/datify";
import { validateNumber } from "@/utils/number";
import { queryKeys } from "@/utils/query-keys";
import { userLevelsData } from "@/utils/data/users";
import UsersTabledResults from "@/containers/users-table";
import FormField from "@/components/form/field";
import { SelectPicker } from "@/components/select";
import { DatePicker } from "@/components/date-picker";
import { DialogModal } from "@/components/dialog";
import GroupsSelectPicker from "@/components/groups-selector";
import ActionButton from "@/components/buttons/action-btn";
import type { DatifiedUser } from "@/types/data/user";

type PasswordDialogProps = {
  userId: string;
};
const PasswordDialog = ({ userId = "" }: Partial<PasswordDialogProps>) => {
  const {
    reset,
    register,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, defaultValues },
    handleSubmit,
  } = useForm({ resolver: yupResolver(passwordUserChangeSchema) });

  const {
    isFetching,
    data: userPasswordRes,
    error,
    refetch,
  } = useQuery({
    queryKey: [`${queryKeys.USERDATA}-${userId}`, "password"],
    queryFn: () => {
      return getUserPassword({ query: { id: userId } });
    },
  });

  const { mutateAsync: mutatedUpdater } = useMutation({
    mutationKey: [`${queryKeys.USERDATA}-${userId}`, "password"],
    mutationFn: (password: string) =>
      updateUserPassword({
        query: { id: userId },
        body: { password: password },
      }),
  });

  const closeRef = useRef<HTMLButtonElement | null>(null);

  const handleUpdatePassword = async (body: PasswordUserChangeSchema) => {
    try {
      const res = await mutatedUpdater(body.newPassword);
      if (res.status === 200 && res.data.data.newPassword && res.data.data.id) {
        reset({
          password: body.newPassword,
          newPassword: "",
          confirmPassword: "",
        });
        return;
      }
      throw new Error("Response error");
    } catch (err) {
      console.error("Error password update :", err);
      toast.error("Failed to change password");
    }
  };

  useEffect(() => {
    const password = userPasswordRes?.data?.data?.password || "";
    setValue("password", password, { shouldValidate: true });
  }, [userPasswordRes?.data?.data?.password]);

  useEffect(() => {
    refetch();
  }, [userId]);

  return (
    <DialogModal
      triggerProps={{
        children: (
          <ActionButton
            variant={"secondary"}
            className="border border-destructive"
          >
            Change Password
          </ActionButton>
        ),
      }}
      titleProps={{ children: "View/Edit Users Password" }}
      descriptionProps={{
        children:
          "Please make sure the password you will change, as it will be persistent.",
      }}
    >
      <form
        className="flex flex-col gap-3 relative"
        onSubmit={handleSubmit(handleUpdatePassword)}
      >
        <DialogClose className="opacity-0 size-0 absolute" ref={closeRef} />
        <FormField
          inputType="password"
          label="Current Password"
          readOnly
          disabled
          {...register("password")}
        />
        <FormField
          inputType="password"
          label="New Password"
          {...register("newPassword")}
        />
        <FormField
          inputType="password"
          label="Confirm New Password"
          {...register("confirmPassword")}
        />
        <div className="flex gap-2 pt-4">
          <ActionButton type="submit">Save</ActionButton>
          <ActionButton
            type="button"
            variant={"destructive"}
            onClick={() => {
              closeRef.current?.click();
            }}
          >
            Cancel
          </ActionButton>
        </div>
      </form>
    </DialogModal>
  );
};

const UsersPage = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const {
    refetch: selfRefetch,
    userData,
    userLevel: currentUserLevel,
  } = useUser({});

  const {
    isFetching,
    data: res,
    error,
    refetch,
  } = useQuery({
    queryKey: [`${queryKeys.USERDATA}-${id}`],
    queryFn: () => {
      if (id === (userData?.id || "")) {
        return null;
      }
      return getUserData({ query: { id: id } });
    },
  });

  const containedUserData = res?.data?.data?.id ? res?.data?.data : null;

  const {
    mutateAsync: updateMutater,
    isPending: updateLoading,
    data: updateRes,
    error: updateError,
    isError: isUpdateError,
  } = useMutation({
    mutationKey: [`${queryKeys.USERDATA}-${id}-update`],
    mutationFn: (body: UserSchema) =>
      // @ts-ignore
      updateUser({ query: { id: res?.data?.data?.id }, body: body }),
  });

  const {
    mutateAsync: deleteMutater,
    isPending: deleteLoading,
    data: deleteRes,
    error: deleteError,
    isError: isDeleteError,
  } = useMutation({
    mutationKey: [`${queryKeys.USERDATA}-${id}-delete`],
    mutationFn: () => deleteUser({ query: { id: id } }),
  });

  const { mutateAsync: shortLinkMutater, isPending: shortLinkLoading } =
    useMutation({
      mutationKey: [`${queryKeys.USERDATA}-${id}-short-link`],
      mutationFn: () => generateShortLinkForUser({ query: { id: id } }),
    });

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
      userSchema.concat(
        object().shape({
          expiryMonths: number()
            .optional()
            .min(1, "Must be atleast 1 month")
            .integer("Must be an integer"),
        }),
      ),
    ),
  });

  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const handleUpdate = async (body: UserSchema & { expiryMonths?: number }) => {
    try {
      console.log("User Data", body);
      const res = await updateMutater({
        ...body,
        enabledGroups: body.level !== 0 ? undefined : body.enabledGroups,
        underUser: undefined,
        expiry: currentUserLevel < 2 ? undefined : body.expiry,
        // @ts-ignore
        // expiryMonths: undefined,
        email: undefined,
        // @ts-ignore
        username: undefined,
        // @ts-ignore
        verified: undefined,
      });
      if (res.status === 200) {
        console.log("Updated user");
        refetch();
        selfRefetch();
        // reset(body);
        toast.success("Update successful");
        return;
      }
      throw new Error("Invalid respone");
    } catch (err) {
      const handled = handleAxiosErrorCases(err, []);
      toast.error("Update failed");
      console.error("Update user failed :", err);
    }
  };

  const handleDelete = async () => {
    try {
      // @ts-ignore
      const res = await deleteMutater();
      if (res.status === 200) {
        dialogRef.current?.click();
        console.log("Deleted user");
        toast.success("Deleted user");
        navigate("/dashboard");
        return;
      }
      throw new Error("Invalid respone");
    } catch (err) {
      const handled = handleAxiosErrorCases(err, []);
      toast.error("Deleted failed");
      console.error("Delete user failed :", err);
    }
  };

  const shortLinkGeneration = async () => {
    try {
      const res = await shortLinkMutater();
      const data = res.data?.data;
      if (res.status === 200 && data?.link?.trim()) {
        refetch();
        toast.success("Short Link generated");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof generateShortLinkForUser>>["data"]
      >(err, [
        {
          status: 400,
          handler: (res) => {
            toast.error("Failed to generate short link");
          },
        },
        {
          status: 404,
          handler: (res) => {
            toast.error("No such user exists");
          },
        },
        {
          status: 401,
          handler: (res) => {
            toast.error("You cannot generate short link");
          },
        },
      ]);
      console.error("Short link generation failed :", err);
      !handled && toast.error("Failed to generate short link");
    }
  };

  useEffect(() => {
    if (res?.data?.data?.id) {
      const data = datifyObjectValues(
        {
          ...res.data.data,
          createdAt: undefined,
          updatedAt: undefined,
          id: undefined,
        },
        ["expiry", "testExpiry"],
      ) as Omit<DatifiedUser, "id" | "createdAt" | "updatedAt">;
      try {
        // const validated = userSchema.validateSyncAt(data);
        reset(data);
      } catch (err) {
        console.error("Error user data validation :", err);
      }
    }
  }, [res?.data?.data]);

  return (
    <div className="admin-page-shell">
      {id.trim() &&
        id !== (userData?.id || "") &&
        (res?.data?.data?.id || isFetching ? (
          <form
            className="rounded-md border px-3 py-4 flex flex-col gap-3"
            onSubmit={handleSubmit(handleUpdate)}
          >
            <div className="grid gap-2 gap-y-3 grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] pb-3">
              {isFetching ? (
                Array(6)
                  .fill(null)
                  .map((_, i) => (
                    <Skeleton
                      key={`field-skeleton-${i}`}
                      count={1}
                      className="w-full h-5 rounded-sm"
                    />
                  ))
              ) : (
                <>
                  <FormField
                    label={"Name"}
                    required
                    {...register("name")}
                    error={errors.name}
                  />
                  <FormField
                    label={"Username"}
                    disabled
                    readOnly
                    {...register("username")}
                    error={errors.username}
                  />

                  {/* Email, if self >= admin*/}
                  {(currentUserLevel >= 2 || watch("level", 0) >= 1) && (
                    <FormField
                      type="email"
                      label={"Email"}
                      disabled={currentUserLevel < 2}
                      readOnly={currentUserLevel < 2}
                      {...register("email")}
                      error={errors.email}
                    />
                  )}
                  <FormField
                    required
                    inputType="password"
                    label={"Playlist Password"}
                    {...register("password")}
                    error={errors.password}
                  />

                  {/* Change user level, if self admin */}
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
                              { shouldValidate: true },
                            );
                          },
                        }}
                        items={userLevelsData.filter(
                          (dt) => dt.value < currentUserLevel,
                        )}
                        valueProps={{ placeholder: "Select account type" }}
                        showSeparator={false}
                        showLabel={false}
                      />
                    </FormField>
                  )}

                  {/* Playlist expiry for user only customer */}
                  {watch("level", 0) === 0 &&
                    watch("expiry") instanceof Date && (
                      <FormField
                        label={
                          new Date() >=
                          (watch("expiry") ||
                            moment().subtract(1, "days").toDate())
                            ? "Expired On"
                            : "Expires On"
                        }
                        disabled
                        value={moment(defaultValues?.expiry).format(
                          "DD MMM YYYY",
                        )}
                      ></FormField>
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
                  {watch("level", 0) === 0 && currentUserLevel >= 2 && (
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
                            { shouldValidate: true },
                          );
                        }}
                      />
                    </FormField>
                  )}

                  {/* Groups selection for only customer */}
                  {watch("level", 0) === 0 && (
                    <FormField
                      label={"Select Groups"}
                      required
                      // @ts-ignore
                      error={errors.enabledGroups}
                    >
                      <GroupsSelectPicker
                        key={`selected-${defaultValues?.enabledGroups?.length}`}
                        defaultItems={
                          (defaultValues?.enabledGroups as string[]) || []
                        }
                        onSelect={(groups) => {
                          setValue("enabledGroups", groups || [], {
                            shouldValidate: true,
                          });
                        }}
                      />
                    </FormField>
                  )}

                  {/* If self admin, can update reseller credits */}
                  {watch("level") === 1 && currentUserLevel >= 2 && (
                    <FormField
                      label={"Credits"}
                      type={"number"}
                      min={0}
                      max={999999}
                      defaultValue={defaultValues?.credits}
                      {...register("credits")}
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
                  {watch("level", 0) === 0 && (
                    <FormField
                      label={"Account Status"}
                      required
                      key={`status-def-${defaultValues?.isActive}`}
                    >
                      <SelectPicker
                        className="min-h-[40px] h-auto w-full"
                        wrapperProps={{
                          defaultValue: defaultValues?.isActive
                            ? "active"
                            : "inactive",
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
                        valueProps={{ placeholder: "Select account type" }}
                        showSeparator={false}
                        showLabel={false}
                      />
                    </FormField>
                  )}

                  {!!(
                    (validateNumber(watch("level", 0), { invalidValue: 0 }) ===
                      0 ||
                      validateNumber(watch("level", 0), { invalidValue: 0 }) >=
                        2) &&
                    watch("username", "")?.trim() &&
                    watch("password", "")?.trim()
                  ) && (
                    <div className="col-span-full flex gap-2 flex-wrap items-center pt-3">
                      <ActionButton
                        type="button"
                        className="w-fit bg-green-500 hover:bg-green-500 hover:opacity-90"
                        onClick={async () => {
                          try {
                            const url = `${
                              import.meta.env.VITE_PLAYLIST_BASE
                            }/playlist.m3u?user=${watch(
                              "username",
                              "",
                            )?.trim()}&pass=${watch("password", "")?.trim()}`;
                            await navigator.clipboard.writeText(url);
                            toast.info("Copied Playlist Link");
                          } catch (err: any) {
                            toast.info("Copying Playlist Link failed");
                          }
                        }}
                      >
                        <div className="flex gap-2 items-center">
                          Copy Playlist
                          <Link />
                        </div>
                      </ActionButton>
                      {res?.data?.data?.shortLink?.trim() && (
                        <ActionButton
                          type="button"
                          className="w-fit bg-green-500 hover:bg-green-500 hover:opacity-90"
                          onClick={async () => {
                            try {
                              const url = res.data.data.shortLink as string;
                              await navigator.clipboard.writeText(url);
                              toast.info("Copied Short Link");
                            } catch (err: any) {
                              toast.info("Copying Short Link failed");
                            }
                          }}
                        >
                          <div className="flex gap-2 items-center">
                            Copy Short Link
                            <Link />
                          </div>
                        </ActionButton>
                      )}
                      <ActionButton
                        type="button"
                        className="w-fit bg-blue-500 hover:bg-blue-500 hover:opacity-90"
                        loading={shortLinkLoading}
                        onClick={shortLinkGeneration}
                      >
                        <div className="flex gap-2 items-center">
                          Generate Short Link
                          <ExternalLink />
                        </div>
                      </ActionButton>
                    </div>
                  )}
                </>
              )}
            </div>
            {!isFetching && (
              <div className="flex gap-4">
                <PasswordDialog userId={id} />
                <ActionButton
                  type="submit"
                  loading={updateLoading}
                  className="w-fit"
                >
                  Save Changes
                </ActionButton>
                <DialogModal
                  titleProps={{ children: "Delete Confirmation" }}
                  descriptionProps={{
                    children:
                      "Are you sure to delete this user? Confirm if you are serious or cancel.",
                  }}
                  triggerProps={{
                    children: (
                      <ActionButton
                        type="button"
                        variant={"destructive"}
                        loading={deleteLoading}
                        className="w-fit"
                      >
                        Delete User
                      </ActionButton>
                    ),
                  }}
                  footerProps={{
                    children: (
                      <>
                        <ActionButton
                          variant={"destructive"}
                          type="button"
                          loading={deleteLoading}
                          className="w-fit"
                          onClick={handleDelete}
                        >
                          Confirm
                        </ActionButton>
                        <DialogClose ref={dialogRef} />
                      </>
                    ),
                  }}
                />
              </div>
            )}
          </form>
        ) : (
          <p className="text-xl font-medium">Failed to get user data</p>
        ))}
      {(id?.trim() && id !== userData?.id
        ? validateNumber(watch("level", 0), { invalidValue: 0 })
        : currentUserLevel) > 0 && (
        <>
          <h4 className="pt-[40px] font-bold text-xl">
            Users under{" "}
            {id?.trim() && id !== userData?.id
              ? defaultValues?.name || "this user"
              : "me"}
          </h4>
          <UsersTabledResults className="" />
        </>
      )}
    </div>
  );
};

export default UsersPage;
