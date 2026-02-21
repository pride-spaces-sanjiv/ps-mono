import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { DialogClose } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAutoMediaDataFetch } from "@/services/hooks/useAutoMediaData";
import { addChannel, testChannelStream } from "@/services/apis/admin-channel";
import {
  channelSchema,
  type ChannelSchema,
  addChannelSchema,
  type AddChannelSchema,
  keyTypes,
  streamTypes,
} from "@/utils/schemas/channel";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { Providers } from "@/utils/data/providers";
import { queryKeys } from "@/utils/query-keys";
import { DialogModal } from "@/components/dialog";
import { SelectPicker } from "@/components/select";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
// types
import type { DatifiedChannel, DatifiedProvider } from "@/types/data/media";
import type { DatifiedGroup } from "@/types/data/media";
import { cn } from "@/utils/cn";

type ChannelData = ChannelSchema &
  Partial<Omit<AddChannelSchema, keyof ChannelSchema>>;
const defaultChannelData: ChannelData = {
  name: "",
  tvgLogo: "",
  tvgId: "",
  groupId: "",
  enabled: false,
  provider: undefined,
  streamUrl: undefined,
};

type Props = {
  data: Partial<AddChannelSchema>;
  groups: DatifiedGroup[];
  provider: DatifiedProvider;
  onAddSuccess: (data: DatifiedChannel) => any;
  userLevel: number;
};
export default function AddChannelDialog({
  data,
  groups,
  provider,
  onAddSuccess,
  userLevel = 0,
}: Partial<Props>) {
  const { providersState, commonGroupsState: groupsState } =
    useAutoMediaDataFetch();
  const providersData = providersState.value.filter(
    (pr) => pr.aliasId === Providers.JIO || pr.aliasId === Providers.ZEE,
  );
  const groupsData = groupsState.value;

  const {
    setValue,
    watch,
    getFieldState,
    getValues,
    handleSubmit,
    formState: { errors, isValid: isFormValid, defaultValues: defaultValues },
    reset,
    // @ts-ignore
  } = useForm({ resolver: yupResolver(addChannelSchema), defaultValues: data });
  const formData = watch();

  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const {
    mutateAsync: mutater,
    isPending: loading,
    reset: addReset,
  } = useMutation({
    mutationKey: [queryKeys.COMMONCHANNELS, "admin", "add"],
    // @ts-ignore
    mutationFn: (body: typeof formData) => addChannel({ body: body }),
  });
  const {
    mutateAsync: testMutater,
    isPending: testLoading,
    data: testRes,
    reset: testReset,
  } = useMutation({
    mutationKey: [queryKeys.COMMONCHANNELS, "admin", "test"],
    mutationFn: (body: Pick<typeof formData, "provider" | "streamUrl">) =>
      // @ts-ignore
      testChannelStream({ body: body }),
  });

  // Memoized passed data
  const memData = useMemo(() => data, [data]);

  const testResult = useMemo(
    () =>
      testRes?.data.data
        ? {
            ...testRes?.data.data,
            matchedProviderData:
              providersData.find(
                (pr) => pr.aliasId === testRes?.data.data?.matchedProvider,
              ) || null,
          }
        : null,
    [testRes, providersData],
  );

  const handleChannelAdd = async () => {
    try {
      const res = await mutater(formData);
      if (res.status === 201) {
        toast.success("Channel added successfully");
        dialogRef.current?.click();
        // onUpdateSuccess?.(data as DatifiedChannel, body.groupId);
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error adding channel:", err);
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof addChannel>>["data"]
      >(err, [
        {
          status: 404,
          handler: (res) => {
            if (res?.data?.errorType?.includes("group-not-found")) {
              toast.error("Group not found. Select something else");
              return;
            }
            toast.error("Group Not found");
          },
        },
      ]);
      if (!handled) {
        toast.error("Failed to add channel");
      }
    }
  };

  const handleChannelTest = async () => {
    try {
      const res = await testMutater({
        provider: formData.provider,
        streamUrl: formData.streamUrl,
      });
      if (res.status === 200) {
        const data = res.data.data;
        if (!data.isValidToProvider) {
          const provider = providersData.find(
            (pr) => pr.aliasId === data.matchedProvider,
          );
          if (provider) {
            toast.warning(`Channel seems to be for ${provider.name}`);
          }
          toast.warning("Channel seems to be of for the selected provider");
        }
        toast.success("Channel tested successfully");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error testing channel:", err);
      toast.error("Failed to test channel");
    }
  };

  useEffect(() => {
    console.log("Add channel dialog mount");
    return () => {
      console.log("Add channel dialog un-mount");
    };
  }, []);

  return (
    <DialogModal
      triggerProps={{
        children: (
          <ActionButton variant={"secondary"}>Add Channel</ActionButton>
        ),
      }}
      titleProps={{ children: "Add New Channel" }}
      descriptionProps={{
        children: "Please make sure everything is correct before adding.",
      }}
      contentProps={{ className: "max-h-[90dvh] overflow-y-auto" }}
      onOpenChange={(open) => {
        if (!open) {
          reset?.();
          addReset?.();
          testReset?.();
        }
        console.log("Dialog open state changed :", open, memData);
        if (open && memData) {
          reset?.(memData);
        }
      }}
    >
      <div className="flex flex-col gap-2 pt-4 overflow-y-auto max-h-full">
        <DialogClose
          type="button"
          className="size-0 opacity-0"
          ref={dialogRef}
        />
        <FormField
          label={"TVG-ID"}
          placeholder="235"
          required
          onChange={(e) => {
            const val = e.currentTarget.value?.trim();
            setValue(
              "tvgId",
              formData.provider === 2 ? val.replace(/[^0-9]+/g, "") : val,
              { shouldValidate: true },
            );
          }}
          defaultValue={defaultValues?.tvgId}
          error={errors.tvgId}
        />
        <FormField
          label={"Name"}
          placeholder="My Channel"
          required
          onChange={(e) => {
            const val = e.currentTarget.value?.trim();
            setValue("name", val, { shouldValidate: true });
          }}
          defaultValue={defaultValues?.name}
          error={errors.name}
        />
        <FormField
          label={"Logo"}
          placeholder="https://logo.jpg"
          required
          onChange={(e) => {
            const val = e.currentTarget.value?.trim();
            setValue("tvgLogo", val, { shouldValidate: true });
          }}
          defaultValue={defaultValues?.tvgLogo}
          error={errors.tvgLogo}
        />
        {formData.tvgLogo && (
          <div className="w-[60px] aspect-video border rounded-lg bg-white">
            <img
              className="object-contain object-center"
              src={formData.tvgLogo}
              alt="TVG-LOGO"
            />
          </div>
        )}

        <FormField label={"Provider"} required error={errors.provider}>
          <SelectPicker
            wrapperProps={{
              onValueChange: (val) =>
                setValue("provider", Number(val), { shouldValidate: true }),
            }}
            className="w-full"
            items={providersData?.map((pr) => ({
              label: pr.name,
              value: pr.aliasId,
            }))}
            defaultValue={
              defaultValues?.provider || providersData?.[0]?.aliasId
            }
          />
        </FormField>
        {formData.provider && (
          <FormField label={"Group"} required error={errors.groupId}>
            <SelectPicker
              wrapperProps={{
                defaultValue: defaultValues?.groupId as string,
                onValueChange: (val) =>
                  setValue("groupId", val, { shouldValidate: true }),
              }}
              className="w-full"
              items={groupsData
                ?.filter((gr) => gr.provider === formData.provider)
                .map((gr) => ({ label: gr.name, value: gr.id }))}
              defaultValue={defaultValues?.groupId}
            />
          </FormField>
        )}

        <FormField label={"Key Type"} error={errors.keyType}>
          <SelectPicker
            wrapperProps={{
              defaultValue: defaultValues?.keyType as string,
              onValueChange: (val) => {
                setValue(
                  "keyType",
                  val === String(undefined)
                    ? undefined
                    : (val as NonNullable<typeof data>["keyType"]),
                  {
                    shouldValidate: true,
                  },
                );
              },
            }}
            className="w-full"
            items={keyTypes
              .map((state) => ({
                label: state[0].toUpperCase() + state.slice(1).toLowerCase(),
                value: state as typeof state | undefined,
              }))
              .concat({ label: "None", value: undefined })}
            defaultValue={defaultValues?.keyType as string}
          />
        </FormField>
        <FormField label={"Stream Type"} error={errors.streamType}>
          <SelectPicker
            wrapperProps={{
              defaultValue: defaultValues?.streamType as string,
              onValueChange: (val) =>
                setValue(
                  "streamType",
                  val === String(undefined)
                    ? undefined
                    : (val as NonNullable<typeof data>["streamType"]),
                  {
                    shouldValidate: true,
                  },
                ),
            }}
            className="w-full"
            items={streamTypes
              .map((state) => ({
                label: state.toUpperCase(),
                value: state as typeof state | undefined,
              }))
              .concat({ label: "None", value: undefined })}
            defaultValue={defaultValues?.streamType as string}
          />
        </FormField>

        <FormField label={"Status"} required error={errors.enabled}>
          <SelectPicker
            wrapperProps={{
              defaultValue:
                defaultValues?.enabled === false ? "Inactive" : "Active",
              onValueChange: (val) =>
                setValue("enabled", val.toLowerCase() === "active", {
                  shouldValidate: true,
                }),
            }}
            className="w-full"
            items={["Active", "Inactive"]?.map((state) => ({
              label: state,
              value: state,
            }))}
            defaultValue={
              defaultValues?.enabled === false ? "Inactive" : "Active"
            }
          />
        </FormField>

        <FormField
          label={"Stream URL"}
          placeholder="https://streamlink.mpd, https://streamlink.m3u8"
          required
          onChange={(e) => {
            const val = e.currentTarget.value?.trim();
            setValue("streamUrl", val, { shouldValidate: true });
          }}
          defaultValue={defaultValues?.streamUrl}
          error={errors.streamUrl}
        />

        {!!testResult?.redirects.length && (
          <div className="flex flex-col gap-2">
            {testResult.redirects.map((dt, i) => (
              <div
                key={`test-result-${i}`}
                className="rounded-lg border border-secondary-foreground flex overflow-hidden"
              >
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      className={cn(
                        "py-2 px-3 border-r border-inherit h-full",
                        dt.status >= 400 ? "bg-red-500" : "bg-green-500",
                      )}
                    >
                      {dt.status}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{dt.statusText}</TooltipContent>
                </Tooltip>

                <div className={cn("bg-secondary py-2 px-3 w-full")}>
                  {dt.url.href}
                </div>
              </div>
            ))}
          </div>
        )}
        {testResult && (
          <div
            className={cn(
              "py-3 text-lg",
              testResult.isValidToProvider
                ? "text-green-500"
                : testResult.matchedProviderData
                  ? "text-orange-300"
                  : "text-red-500",
            )}
          >
            {testResult.isValidToProvider
              ? `Stream URL matched with  ${providersData.find(
                  (pr) => pr.aliasId === formData.provider,
                )}`
              : testResult.matchedProviderData
                ? `Stream URL matched ${
                    testResult.matchedProviderData?.name
                  } instead of ${
                    providersData.find((pr) => pr.aliasId === formData.provider)
                      ?.name || "none"
                  }`
                : "Stream URL did not matched any provider"}
          </div>
        )}

        <div className="py-2"></div>

        <div className="flex gap-2 flex-wrap">
          <ActionButton
            loading={loading}
            className="col-span-full w-fit"
            type="button"
            onClick={(e) => {
              handleSubmit((data) => {
                console.log("Add button :", data);
              })(e);
              isFormValid && handleChannelAdd();
            }}
          >
            Create
          </ActionButton>
          <ActionButton
            variant={"secondary"}
            loading={testLoading}
            className="col-span-full w-fit"
            type="button"
            onClick={(e) => {
              handleSubmit((data) => {
                console.log("Test button :", data);
              })(e);
              isFormValid && handleChannelTest();
            }}
          >
            Test Channel
          </ActionButton>
        </div>
      </div>
    </DialogModal>
  );
}
