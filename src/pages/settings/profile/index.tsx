import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { TabsContent } from "@/components/ui/tabs";
import {
  CardHeader,
  Card,
  CardDescription,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCcw, Link, ExternalLink } from "lucide-react";
import { useUser } from "@/services/hooks/use-user";
import { updateAccountData, generateShortLink } from "@/services/apis/account";
import { resetPasswordRequest } from "@/services/apis/auth";
import {
  userSchema,
  type LoginSchema,
  type UserSchema,
} from "@/utils/schemas/user";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { validateNumber } from "@/utils/number";
import { pickFields } from "@/utils/object/field";
import { delayPromise } from "@/utils/promise";
import { queryKeys } from "@/utils/query-keys";
import { userLevelsData } from "@/utils/data/users";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";

export default function SettingsProfile() {
  const { userData, userLevel, userStoreState } = useUser();

  const {
    mutateAsync: updateMutater,
    isPending: updateLoading,
    data: updateRes,
    error: updateError,
    isError: isUpdateError,
  } = useMutation({
    mutationKey: [queryKeys.USERDATA, "self", "update"],
    mutationFn: (
      body: NonNullable<
        NonNullable<Parameters<typeof updateAccountData>[0]>["body"]
      >
    ) =>
      delayPromise(
        updateAccountData({ query: { id: userData?.id }, body: body }),
        1
      ),
  });

  // Reset password request
  const {
    data: reqData,
    mutateAsync: reqMutater,
    isPending: reqLoading,
    isError: reqErrored,
    error: reqError,
    isSuccess: reqFinished,
  } = useMutation({
    mutationKey: ["reset-req"],
    mutationFn: (body: Pick<LoginSchema, "email">) =>
      delayPromise(resetPasswordRequest({ body: body }), 1),
  });

  const { mutateAsync: shortLinkMutater, isPending: shortLinkLoading } =
    useMutation({
      mutationKey: ["short-link"],
      mutationFn: () => generateShortLink(),
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
    resolver: yupResolver(userSchema),
  });

  const handleUpdate = async (body: UserSchema) => {
    try {
      const cleaned = pickFields({ ...body, phone: body.phone }, [
        "name",
        "password",
        "phone",
      ]);
      console.log("Body", cleaned);
      const res = await updateMutater(cleaned);
      if (res.status === 200 && res?.data?.data?.id === userData?.id) {
        reset({ ...defaultValues, ...cleaned });
        userStoreState.setter({
          ...userStoreState.value,
          ...cleaned,
        } as typeof userData);
        console.log("Updated user profile");
        toast.success("Updated profile");

        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases(err, []);
      console.error("Update profile failed:", err);
      toast.error("Failed to update");
    }
  };

  const sendResetPassRequest = async () => {
    try {
      const res = await reqMutater({ email: userData?.email || "" });
      if (res.status === 200) {
        toast.success("Reset Password request sent. Check your email!");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof resetPasswordRequest>>
      >(err, [
        {
          status: 400,
          handler: (res) => {
            toast.error("Failed to request for password reset");
          },
        },
        {
          status: 404,
          handler: (res) => {
            toast.error("No such user exists");
          },
        },
      ]);
      console.error("Reset pass request failed :", err);
      !handled && toast.error("Failed to request for password reset");
    }
  };

  const shortLinkGeneration = async () => {
    try {
      const res = await shortLinkMutater();
      const data = res.data?.data;
      if (res.status === 200 && data?.link?.trim()) {
        // @ts-ignore
        userStoreState.setter({
          ...userStoreState.value,
          shortLink: data.link.trim(),
        });
        toast.success("Short Link generated");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof generateShortLink>>["data"]
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

  const availableCredits = validateNumber(userData?.credits, {
    invalidValue: 0,
  });

  useEffect(() => {
    reset?.({ ...userData });
  }, [userData]);

  return (
    <TabsContent value="profile" className="mt-0">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your profile information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="rounded-md border px-3 py-4 auto-form-grid"
            onSubmit={handleSubmit(handleUpdate)}
          >
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

            <FormField
              label={"Email"}
              disabled
              readOnly
              {...register("email")}
              error={errors.email}
            />

            <FormField
              required
              inputType="password"
              label={"Playlist Password"}
              placeholder="••••••••"
              {...register("password")}
              error={errors.password}
            />

            <FormField
              label={"Account Type"}
              disabled
              readOnly
              value={
                userLevelsData.find((dt) => dt.value === watch("level", 0))
                  ?.label || "Unknown"
              }
            />

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
                  ? {
                      ...errors.phone,
                      message: "Invalid phone number",
                    }
                  : undefined
              }
            />

            {!!(
              userLevel >= 2 &&
              userData?.username?.trim() &&
              userData?.password?.trim()
            ) && (
              <div className="col-span-full flex gap-2 flex-wrap items-center pt-3">
                <ActionButton
                  type="button"
                  className="w-fit bg-green-500 hover:bg-green-500 hover:opacity-90"
                  onClick={async () => {
                    try {
                      const url = `${
                        import.meta.env.VITE_PLAYLIST_BASE
                      }/playlist.m3u?user=${userData?.username?.trim()}&pass=${userData?.password?.trim()}`;
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
                {userData?.shortLink?.trim() && (
                  <ActionButton
                    type="button"
                    className="w-fit bg-green-500 hover:bg-green-500 hover:opacity-90"
                    onClick={async () => {
                      try {
                        const url = userData.shortLink as string;
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

            <div className="flex gap-2 pt-4 col-span-full max-[500px]:flex-wrap">
              <ActionButton
                type="submit"
                loading={updateLoading}
                className="w-fit max-[500px]:w-full"
              >
                Save Changes
              </ActionButton>
              <ActionButton
                type="button"
                variant="outline"
                loading={reqLoading}
                onClick={sendResetPassRequest}
                className="w-fit max-[500px]:w-full"
              >
                <div className="flex items-center gap-2">
                  <RefreshCcw className="size-4" />
                  Request Password Reset
                </div>
              </ActionButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
