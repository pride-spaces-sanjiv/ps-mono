import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { ArrowLeft, ImagePlus, MessageSquareWarning, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAmenities } from "@/services/hooks/useAmenities";
import { useUser } from "@/services/hooks/use-user";
import {
  getSpaceById as getAdminSpaceById,
  updateSpace as updateAdminSpace,
} from "@/services/apis/admin/spaces";
import {
  getSpaceData as getOperatorSpaceById,
  updateSpace as updateOperatorSpace,
} from "@/services/apis/operator/spaces";
import { getMapsURLPos } from "@/services/apis/general/location";
import {
  spaceSchema,
  type SpaceSchema,
} from "@pride-spaces/common/utils/schemas/space.js";
import { datifyObjectValues } from "@pride-spaces/common/utils/object/datify.js";
import {
  certificates,
  type Certificate,
} from "@pride-spaces/common/utils/data/certificates.js";
import { operatorSchema } from "@/utils/schemas/operators";
import { queryKeys } from "@/utils/query-keys";
import { days, shortDays } from "@/utils/data/days";
import { spaceCategories } from "@/utils/data/category";
import {
  getDenotedWorkingSize,
  labelledWorkingSizes,
  workingSizes,
  type WorkingSize,
} from "@/utils/data/workingSizes";
import {
  labelledSpaceGrades,
  labelledSpaceTypes,
  spaceGrades,
} from "@/utils/data/spaceTypes";
import { GroupedSearchSelect } from "@/components/search-select";
import SelectAmenities from "@/containers/amenities/select-dialog";
import { DialogModal } from "@/components/dialog";
import { SelectPicker } from "@/components/select";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import MapsField from "@/components/maps";
import ChippedElements from "@/components/chips";
import ActionButton from "@/components/buttons/action-btn";
import type { Operator } from "@/types/data/operators";
import type { Dump } from "@/types/data/dump";
import type { Space } from "@/types/data/spaces";
import { compareFields } from "@/utils/object/compare";
import { deleteDump, recorrectDump } from "@/services/apis/admin/dump";
import { uploadImageFile, uploadLayoutFile } from "@/services/apis/admin/file";
import { highlightFieldClassName } from "@/utils/string/field-change-classname";
import FileUpload, { type UploadedFile } from "@/components/form/file-upload";
import { mediaTypes } from "@pride-spaces/common/utils/data/media.js";
import { type MediaType } from "@pride-spaces/common/utils/data/media.js";
import { useMappedFilesState } from "@/services/hooks/use-file";
import FilePreview from "@/components/file/preview";
import { sleep } from "@pride-spaces/common/utils/time.js";
import SpaceImagesUploadSection from "@/containers/space/section/image-upload";
import SpaceLayoutsUploadSection from "@/containers/space/section/layout-upload";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { cn } from "@/utils/className";
import { useStatesCities } from "@/services/hooks/use-states-cities";
import SpaceLocationDetailsSection from "@/containers/space/section/space-location-details";
import SpacePricingDetailsSection from "@/containers/space/section/space-pricing-details";
import SpaceAmenitiesSection from "@/containers/space/section/space-amenities";
import SpaceCertificationsSection from "@/containers/space/section/space-certifications";
import SpacePocDetailsSection from "@/containers/space/section/space-poc-details";
import SpaceDetailsSection from "@/containers/space/section/space-details";

const defaultTime = moment().hour(0).minute(0).toDate();

const ocStatusOptions = [
  { label: "OC", value: "OC" },
  { label: "NON OC", value: "NON OC" },
  { label: "!", value: "!" },
];

const sezStatusOptions = [
  { label: "SEZ", value: "SEZ" },
  { label: "NON SEZ", value: "NON SEZ" },
  { label: "!", value: "!" },
];

const SpaceEditPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const isConfirmedRef = useRef(false);
  const seatsHasPressedEnter = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [pendingFormData, setPendingFormData] = useState<SpaceSchema | null>(
    null,
  );

  const { from: fromRoute, data: locData } = useMemo(() => {
    const state = location.state as
      | undefined
      | null
      | { from?: string; data?: Dump<Space> };
    return state || {};
  }, [location.state]);

  const isDump = useMemo(
    () => fromRoute === "notifications" && !!locData,
    [fromRoute, locData],
  );

  const { userLevel } = useUser();
  const isOperatorPortal = userLevel === "operator";
  const getSpaceById = isOperatorPortal
    ? getOperatorSpaceById
    : getAdminSpaceById;
  const updateSpace = updateAdminSpace;
  const homeRoute = isOperatorPortal ? "/partner" : "/spaces";

  const { amenitiesData } = useAmenities();
  const { groupedCities, citiesData, statesData } = useStatesCities();

  // Fetch Data using Centre ID
  const {
    data: res,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [queryKeys.SPACES, id],
    queryFn: () =>
      getSpaceById({ query: { withOperator: true }, url: `/${id}` }),
    enabled: !!id,
  });
  console.log("space data", res?.data);

  // Get added or changed fields
  const { mainChanges, locationChanges, personChanges, pricingChanges } =
    useMemo(() => {
      const currentData = res?.data?.data;
      const notificationData =
        fromRoute === "notifications" ? locData?.data : undefined;

      return !notificationData
        ? {}
        : {
            mainChanges: compareFields(currentData, notificationData, {
              excludeFields: [
                "id",
                "createdAt",
                "updatedAt",
                "references",
                "location",
                "person",
                "pricing",
              ],
            }),
            locationChanges: compareFields(
              currentData?.location,
              notificationData?.location,
            ),
            personChanges: compareFields(
              currentData?.person,
              notificationData?.person,
            ),
            pricingChanges: compareFields(
              currentData?.pricing,
              notificationData?.pricing,
            ),
          };
    }, [res?.data, locData?.data, fromRoute]);

  const allUpdatedData = useMemo(() => {
    return {
      ...mainChanges?.allData,
      ...(locationChanges?.allFields.length
        ? {
            location: {
              ...res?.data?.data?.location,
              ...locationChanges?.allData,
            },
          }
        : {}),
      ...(personChanges?.allFields.length
        ? {
            person: {
              ...res?.data?.data?.person,
              ...personChanges?.allData,
            },
          }
        : {}),
      ...(pricingChanges?.allFields.length
        ? {
            pricing: {
              ...res?.data?.data?.pricing,
              ...pricingChanges?.allData,
            },
          }
        : {}),
    };
  }, [
    mainChanges?.allData,
    locationChanges?.allData,
    locationChanges?.allFields.length,
    personChanges?.allData,
    personChanges?.allFields.length,
    pricingChanges?.allData,
    pricingChanges?.allFields.length,
    res?.data?.data?.location,
    res?.data?.data?.person,
    res?.data?.data?.pricing,
  ]);
  console.log("Changed space data :", allUpdatedData);

  const changedFieldProps = (
    data: Record<string, unknown> | null | undefined,
    field: string,
  ) => {
    if (fromRoute !== "notifications" || !locData) return {};

    const className = highlightFieldClassName(data, field);
    if (!className) return {};

    return {
      embeddedWrapperProps: {
        className,
      },
    };
  };

  // form builder
  const formReturns = useForm({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      timing: {
        openDays: days.map((_, i) => i + 1).filter((_, i) => i < 6),
        openTime: defaultTime,
        closeTime: defaultTime,
      },

      specs: {
        category: "Classic",
        spaceType: "Flex",
        grade: "B",
        area: 0,
        workingSizes: [],
      },

      seats: {
        total: 0,
        booked: 0,
      },

      flags: {
        isActive: true,
        isVerified: false,
        isOc: "!",
        isSez: "!",
        isVoService: false,
      },

      terms: {
        lockIn: "",
        noticePeriod: "",
        securityDeposit: "",
      },

      pricing: {
        dayPass: 0,
        perSeat: 0,
        dedicatedDesk: 0,
        flexiDesk: 0,
        privateCabin: 0,
        meetingRoom: 0,
        vo: 0,
      },
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useMemo(() => formReturns, [formReturns]);

  const selectedGrade = watch("specs.grade");
  const selectedSpaceType = watch("specs.spaceType");
  const isMos = selectedSpaceType === "MOS";

  const openTimeWatch = watch("timing.openTime");
  const closeTimeWatch = watch("timing.closeTime");

  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const min of [0, 30]) {
        const hh = hour.toString().padStart(2, "0");
        const mm = min.toString().padStart(2, "0");
        const val = `${hh}:${mm}`;
        const label = moment(val, "HH:mm").format("hh:mma");
        options.push({ label, value: val });
      }
    }
    const currentOpen = openTimeWatch
      ? moment(openTimeWatch).format("HH:mm")
      : null;
    if (currentOpen && !options.some((o) => o.value === currentOpen)) {
      options.push({
        label: moment(currentOpen, "HH:mm").format("hh:mma"),
        value: currentOpen,
      });
    }
    const currentClose = closeTimeWatch
      ? moment(closeTimeWatch).format("HH:mm")
      : null;
    if (currentClose && !options.some((o) => o.value === currentClose)) {
      options.push({
        label: moment(currentClose, "HH:mm").format("hh:mma"),
        value: currentClose,
      });
    }
    return options;
  }, [openTimeWatch, closeTimeWatch]);
  const operatorData = useMemo(
    () =>
      (res?.data?.data?.references?.operator as
        | Partial<Operator>
        | null
        | undefined) || null,
    [res?.data],
  );
  const [POCSameAsOperator, setPOCSameAsOperator] = useState(false);
  const [correctionComment, setCorrectionComment] = useState("");
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const {
    images: [images, setImages],
    layouts: [layouts, setLayouts],
  } = useMappedFilesState({
    names: ["images", "layouts"],
  });

  // useEffect(() => {
  //   if (data) {
  //     reset(data);
  //   }
  // }, [data]);
  useEffect(() => {
    if (res?.data?.data) {
      const modified = datifyObjectValues(
        { ...res?.data?.data, ...(isDump ? allUpdatedData : {}) },
        ["createdAt", "updatedAt", "timing.closeTime", "timing.openTime"],
      );
      console.log("Modified centre data :", modified);
      reset({
        ...modified,
        slug: modified?.slug || modified?.references?.operator?.slug,

        timing: {
          ...modified?.timing,
          openTime: modified?.timing?.openTime ?? defaultTime,
          closeTime: modified?.timing?.closeTime ?? defaultTime,
          openingDay:
            modified?.timing?.openingDay ||
            (modified?.timing?.openDays?.length
              ? days[modified.timing.openDays[0] - 1]
              : "Monday"),
          closingDay:
            modified?.timing?.closingDay ||
            (modified?.timing?.openDays?.length
              ? days[
                  modified.timing.openDays[
                    modified.timing.openDays.length - 1
                  ] - 1
                ]
              : "Saturday"),
        },

        flags: {
          ...modified?.flags,
          isOc:
            modified?.flags?.isOc === true
              ? "OC"
              : modified?.flags?.isOc === false
                ? "NON OC"
                : typeof modified?.flags?.isOc === "string" &&
                    (modified?.flags?.isOc?.toUpperCase() === "NON OC" ||
                      modified?.flags?.isOc?.toUpperCase() === "NON-OC")
                  ? "NON OC"
                  : typeof modified?.flags?.isOc === "string" &&
                      modified?.flags?.isOc?.toUpperCase() === "OC"
                    ? "OC"
                    : modified?.flags?.isOc || "!",
          isSez:
            modified?.flags?.isSez === true
              ? "SEZ"
              : modified?.flags?.isSez === false
                ? "NON SEZ"
                : typeof modified?.flags?.isSez === "string" &&
                    (modified?.flags?.isSez?.toUpperCase() === "NON SEZ" ||
                      modified?.flags?.isSez?.toUpperCase() === "NON-SEZ")
                  ? "NON SEZ"
                  : typeof modified?.flags?.isSez === "string" &&
                      modified?.flags?.isSez?.toUpperCase() === "SEZ"
                    ? "SEZ"
                    : modified?.flags?.isSez || "!",
          isVoService:
            modified?.flags?.isVoService ??
            Boolean(modified?.pricing?.vo && modified?.pricing?.vo > 0),
        },

        person: {
          ...(POCSameAsOperator
            ? operatorData?.person
            : res?.data?.data?.person),
          ...allUpdatedData?.person,
        },
      } as NonNullable<typeof modified>);
    }
  }, [
    selectedGrade,
    setValue,
    res,
    POCSameAsOperator,
    operatorData,
    allUpdatedData,
  ]);

  // Update Mutater
  const { mutateAsync, isPending: updateLoading } = useMutation({
    mutationFn: updateSpace,
  });

  // File Image Mutater
  const { mutateAsync: imageUploadMutater, isPending: imageUploadPending } =
    useMutation({
      mutationFn: uploadImageFile,
    });
  // File Layout Mutater
  const { mutateAsync: layoutUploadMutater, isPending: layoutUploadPending } =
    useMutation({
      mutationFn: uploadLayoutFile,
    });

  const { mutateAsync: approvalMutater, isPending: approvalPending } =
    useMutation({
      mutationKey: [queryKeys.DUMPS, id, "delete"],
      mutationFn: deleteDump,
    });

  const { mutateAsync: correctionMutater, isPending: correctionPending } =
    useMutation({
      mutationKey: [queryKeys.DUMPS, id, "recorrect"],
      mutationFn: recorrectDump,
    });

  const { mutateAsync: mapsURLPosMutater, isPending: mapsLoading } =
    useMutation({
      mutationFn: (
        body: (Required<Parameters<typeof getMapsURLPos>[0]> & {})["body"],
      ) => getMapsURLPos({ body }),
    });

  // 2 secs debounced maps url set
  useDebouncer(watch("location.url"), 2000, async (url) => {
    try {
      console.log("Location url debounced :", url);
      if (
        url?.trim() &&
        spaceSchema.shape.location.shape.url.safeParse(url).success
      ) {
        const res = await mapsURLPosMutater({ url });
        const data = res.data?.data;
        if (data.lat && data.lng) {
          setValue("location.lat", data.lat);
          setValue("location.lng", data.lng);
        }
      }
    } catch (err) {
      console.error("Error location url debouncer :", err);
    }
  });

  const activeInputHasPressedEnter = useRef<Record<string, boolean>>({});

  const revertAllFormFields = () => {
    if (res?.data?.data) {
      const modified = datifyObjectValues(
        { ...res?.data?.data, ...allUpdatedData },
        ["createdAt", "updatedAt", "timing.closeTime", "timing.openTime"],
      );
      reset({
        ...modified,
        slug: modified?.references?.operator?.slug,
        timing: {
          ...modified?.timing,
          openTime: modified?.timing?.openTime ?? defaultTime,
          closeTime: modified?.timing?.closeTime ?? defaultTime,
          openingDay:
            modified?.timing?.openingDay ||
            (modified?.timing?.openDays?.length
              ? days[modified.timing.openDays[0] - 1]
              : "Monday"),
          closingDay:
            modified?.timing?.closingDay ||
            (modified?.timing?.openDays?.length
              ? days[
                  modified.timing.openDays[
                    modified.timing.openDays.length - 1
                  ] - 1
                ]
              : "Saturday"),
        },
        flags: {
          ...modified?.flags,
          isOc:
            modified?.flags?.isOc === true
              ? "OC"
              : modified?.flags?.isOc === false
                ? "NON OC"
                : typeof modified?.flags?.isOc === "string" &&
                    (modified?.flags?.isOc?.toUpperCase() === "NON OC" ||
                      modified?.flags?.isOc?.toUpperCase() === "NON-OC")
                  ? "NON OC"
                  : typeof modified?.flags?.isOc === "string" &&
                      modified?.flags?.isOc?.toUpperCase() === "OC"
                    ? "OC"
                    : modified?.flags?.isOc || "!",
          isSez:
            modified?.flags?.isSez === true
              ? "SEZ"
              : modified?.flags?.isSez === false
                ? "NON SEZ"
                : typeof modified?.flags?.isSez === "string" &&
                    (modified?.flags?.isSez?.toUpperCase() === "NON SEZ" ||
                      modified?.flags?.isSez?.toUpperCase() === "NON-SEZ")
                  ? "NON SEZ"
                  : typeof modified?.flags?.isSez === "string" &&
                      modified?.flags?.isSez?.toUpperCase() === "SEZ"
                    ? "SEZ"
                    : modified?.flags?.isSez || "!",
          isVoService:
            modified?.flags?.isVoService ??
            Boolean(modified?.pricing?.vo && modified?.pricing?.vo > 0),
        },
        person: {
          ...(POCSameAsOperator
            ? operatorData?.person
            : res?.data?.data?.person),
          ...allUpdatedData?.person,
        },
      } as any);
    }
  };

  const autoSave = async () => {
    return;
    handleSubmit(async (data) => {
      try {
        console.log("Auto-saving space...", data);
        const saveRes = await mutateAsync({
          url: id,
          body: data,
        });
        if (saveRes.status === 200) {
          toast.success("Changes saved successfully");
          refetch();
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
        toast.error("Failed to auto-save changes");
        revertAllFormFields();
      }
    })();
  };

  const registerWithAutoSave = (
    name: Parameters<typeof register>[0],
    options?: Parameters<typeof register>[1],
  ) => {
    return register(name, {
      ...options,
      onBlur: (e) => {
        options?.onBlur?.(e);
        if (activeInputHasPressedEnter.current[name]) {
          autoSave();
        } else {
          revertAllFormFields();
        }
        activeInputHasPressedEnter.current[name] = false;
      },
    });
  };

  const onSubmit = async (body: SpaceSchema, navigateOnSuccess = false) => {
    try {
      console.log("Space edit body", body);

      if (body.specs?.spaceType === "MOS") {
        body.pricing = {
          ...body.pricing,
          dayPass: 0,
          meetingRoom: 0,
          dedicatedDesk: 0,
          flexiDesk: 0,
          vo: 0,
        };
        if (body.flags) {
          body.flags.isVoService = false;
        }
      }

      const res = await mutateAsync({
        url: id,
        body,
      });

      if (isDump) {
        const dumpRes = await approvalMutater({ url: locData?.id });
        if (dumpRes.status !== 200) {
          throw new Error("Dump approval failed");
        }
      }

      if (res.status === 200) {
        toast.success(`Centre ${isDump ? "approved" : "updated"} successfully`);
        if (navigateOnSuccess) {
          navigate(isDump ? "/notifications" : homeRoute);
        } else {
          // refetch();
        }
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to update space");
      revertAllFormFields();
    }
  };

  const handleSendToCorrection = async () => {
    if (!locData?.id) return;

    if (!correctionComment.trim()) {
      toast.error("Please add a correction comment");
      return;
    }

    try {
      const res = await correctionMutater({
        url: locData.id,
        body: {
          comment: correctionComment.trim(),
          status: "recorrect",
          to: locData.from?.id,
        },
      });

      if (res.status === 200) {
        toast.success("Sent to correction");
        setIsCorrectionDialogOpen(false);
        navigate("/notifications");
        return;
      }

      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error sending correction:", err);
      toast.error("Failed to send correction");
    }
  };

  // File Upload
  const handleFileUpload = async (
    file: UploadedFile,
    fileType = "image" as MediaType,
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("name", file.file.name);
      formData.append("id", file.id);
      formData.append("contentType", file.file.type);
      formData.append("fileType", fileType);
      const res = await (fileType === "image"
        ? uploadImageFile({ body: formData })
        : uploadLayoutFile({ body: formData }));
      if (res.status === 201 && res?.data?.data?.files) {
        const resFile = res.data?.data?.files[0];
        const oldAllFiles = watch("files", {});
        const currentFiles = new Set([
          ...(oldAllFiles?.[`${fileType}s` as keyof typeof oldAllFiles] || []),
          resFile.filename,
        ]);
        setValue("files", {
          ...oldAllFiles,
          [`${fileType}s`]: Array.from(currentFiles),
        });
        toast.success(
          `File uploaded successfully: ${fileType} ${file.file.name}`,
        );
        return res;
      }
      throw new Error("Invalid response");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload ${fileType} : ${file.file.name}`);
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-6 relative">
      {isOperatorPortal && (
        <div className="max-w-4xl mx-auto mb-2">
          <ActionButton
            type="button"
            variant="ghost"
            className="gap-2 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(homeRoute)}
          >
            <ArrowLeft className="size-4" />
            Back to Portal
          </ActionButton>
        </div>
      )}
      <div
        className={cn(
          "max-w-4xl pt-3 mx-auto sticky bg-background",
          isOperatorPortal ? "top-16 z-30" : "top-0 z-50",
        )}
      >
        <div className="flex justify-between items-center my-4 gap-3">
          <h1 className="text-2xl font-bold">
            Edit Centre: {watch("name", "")}
          </h1>

          {/* Toggles */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground text-sm">Active</label>
              <Switch
                key={watch("flags.isActive") ? "active" : "inactive"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400/60"
                checked={!!watch("flags.isActive")}
                onCheckedChange={(checked) => {
                  setValue("flags.isActive", checked, { shouldValidate: true });
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-muted-foreground text-sm">Verified</label>
              <Switch
                key={watch("flags.isVerified") ? "verified" : "unverified"}
                checked={!!watch("flags.isVerified")}
                onCheckedChange={(checked) => {
                  setValue("flags.isVerified", checked, {
                    shouldValidate: true,
                  });
                }}
              />
            </div>
          </div>

          {/* Submit */}

          <ActionButton
            className="justify-end"
            loading={updateLoading}
            onClick={() => {
              formRef?.current?.requestSubmit?.();
            }}
          >
            <div className="flex items-center gap-2">
              Save Changes <Save />
            </div>
          </ActionButton>
        </div>
        <div className="flex-1 pt-4 border-b border-muted-foreground/20"></div>
      </div>

      <div className="w-full max-w-4xl mx-auto py-8">
        {isDump && locData?.comment && (
          <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-xs">
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-900">
              <MessageSquareWarning className="size-4 text-amber-700" />
              Correction requested
            </div>
            <p className="leading-relaxed text-amber-800">{locData.comment}</p>
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit(
            (data) => {
              console.log("Centre form data valid :", data);
              onSubmit(data);
            },
            (errors) => {
              console.log("Centre form data invalid :", errors, watch());
            },
          )}
          // onKeyDown={(e) => {
          //   if (e.key === "Enter") {
          //     const target = e.target as HTMLElement;
          //     if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          //       const input = target as HTMLInputElement;
          //       const fieldName = input.name;
          //       if (input.id === "availableSeats") {
          //         return;
          //       }
          //       e.preventDefault();
          //       e.stopPropagation();
          //       if (fieldName) {
          //         activeInputHasPressedEnter.current[fieldName] = true;
          //       }
          //       input.blur();
          //     }
          //   } else if (e.key === "Escape") {
          //     const target = e.target as HTMLElement;
          //     if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          //       const input = target as HTMLInputElement;
          //       e.preventDefault();
          //       e.stopPropagation();
          //       input.blur();
          //     }
          //   }
          // }}
          className="auto-form-grid"
        >
          {/* SECTION: Centre Details */}
          <SpaceDetailsSection
            formProps={formReturns}
            operatorData={operatorData}
            timeOptions={timeOptions}
            mainChangesAllData={mainChanges?.allData}
            changedFieldProps={changedFieldProps}
            autoSave={autoSave}
            seatsHasPressedEnter={seatsHasPressedEnter}
            isConfirmedRef={isConfirmedRef}
            setPendingFormData={setPendingFormData}
            setIsConfirmDialogOpen={setIsConfirmDialogOpen}
            currentBookedSeats={res?.data?.data?.seats?.booked ?? 0}
            hasLoadedData={!!res?.data?.data}
          />

          {/* SECTION: Centre Point of Contact */}
          <SpacePocDetailsSection
            formProps={formReturns}
            pocSameAsOperator={POCSameAsOperator}
            setPOCSameAsOperator={setPOCSameAsOperator}
            personChangesAllData={personChanges?.allData}
            changedFieldProps={changedFieldProps}
            autoSave={autoSave}
            revertAllFormFields={revertAllFormFields}
            activeInputHasPressedEnter={activeInputHasPressedEnter}
          />

          {/* SECTION: Certifications */}
          <SpaceCertificationsSection
            formProps={formReturns}
            mainChangesAllData={mainChanges?.allData}
            changedFieldProps={changedFieldProps}
            autoSave={autoSave}
          />

          {/* SECTION: Amenities & Event Space Details */}
          <SpaceAmenitiesSection
            formProps={formReturns}
            mainChangesAllData={mainChanges?.allData}
            pricingChangesAllData={pricingChanges?.allData}
            changedFieldProps={changedFieldProps}
            autoSave={autoSave}
          />

          {/* Pricing Details */}
          <SpacePricingDetailsSection
            formProps={formReturns}
            isMos={isMos}
            pricingChangesAllData={pricingChanges?.allData}
            changedFieldProps={changedFieldProps}
            autoSave={autoSave}
          />

          {/* Location Section */}
          <SpaceLocationDetailsSection
            formProps={formReturns}
            operatorData={operatorData}
            locationChangesAllData={locationChanges?.allData}
            changedFieldProps={changedFieldProps}
          />

          {/* Images */}
          <SpaceImagesUploadSection
            existingFiles={defaultValues?.files?.images?.filter(
              (s) => typeof s === "string",
            )}
            processUpload={async (file, setter) => {
              try {
                const fileRes = await handleFileUpload(file, mediaTypes.IMAGE);
                if (!fileRes) {
                  throw new Error("Incomplete");
                }
                // autoSave();
                return {
                  status: "completed",
                };
              } catch (err) {
                return { status: "error" };
              }
            }}
          />

          {/* Layouts */}
          <SpaceLayoutsUploadSection
            existingFiles={defaultValues?.files?.layouts?.filter(
              (s) => typeof s === "string",
            )}
            processUpload={async (file, setter) => {
              try {
                const fileRes = await handleFileUpload(file, mediaTypes.LAYOUT);
                if (!fileRes) {
                  throw new Error("Incomplete");
                }

                // autoSave();
                return {
                  status: "completed",
                };
              } catch (err) {
                return { status: "error" };
              }
            }}
          />

          {/* Submit */}
          <div className="col-span-full flex justify-end">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isDump && (
                <DialogModal
                  open={isCorrectionDialogOpen}
                  onOpenChange={setIsCorrectionDialogOpen}
                  triggerProps={{
                    children: (
                      <ActionButton
                        type="button"
                        variant="outline"
                        className="max-w-fit"
                        loading={correctionPending}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquareWarning className="size-4" />
                          <span>Send to correction</span>
                        </div>
                      </ActionButton>
                    ),
                  }}
                  titleProps={{ children: "Send To Correction" }}
                  descriptionProps={{
                    children:
                      "Add a short note explaining what needs to be corrected before approval.",
                  }}
                  footerProps={{
                    children: (
                      <ActionButton
                        type="button"
                        loading={correctionPending}
                        onClick={handleSendToCorrection}
                      >
                        Send
                      </ActionButton>
                    ),
                  }}
                >
                  <FormField
                    label="Correction comment"
                    inputType="textarea"
                    labelPosition="out"
                    placeholder="Mention what needs to be corrected..."
                    value={correctionComment}
                    onChange={(event) =>
                      setCorrectionComment(event.currentTarget.value)
                    }
                  />
                </DialogModal>
              )}

              {isDump && (
                <ActionButton
                  type="button"
                  loading={
                    updateLoading ||
                    approvalPending ||
                    layoutUploadPending ||
                    imageUploadPending
                  }
                  onClick={() => handleSubmit((data) => onSubmit(data, true))()}
                  className="max-w-fit"
                >
                  Approve
                </ActionButton>
              )}
            </div>
          </div>

          {/* Save Action */}
          {/* <div className="col-span-full flex justify-end pt-4 gap-2">
            <ActionButton loading={updateLoading} type="submit">
              <div className="flex items-center gap-2">
                Save Changes <Save />
              </div>
            </ActionButton>
          </div> */}

          <DialogModal
            open={isConfirmDialogOpen}
            onOpenChange={(open) => {
              setIsConfirmDialogOpen(open);
              if (!open && !isConfirmedRef.current) {
                if (res?.data?.data) {
                  const currentBooked = res.data.data.seats?.booked ?? 0;
                  setValue("seats.booked", currentBooked, {
                    shouldValidate: true,
                  });
                }
              }
            }}
            showClose={false}
            contentProps={{
              onPointerDownOutside: (e) => e.preventDefault(),
              onInteractOutside: (e) => e.preventDefault(),
            }}
            titleProps={{ children: "Confirm Changes" }}
            descriptionProps={{
              children:
                "Are you sure you want to confirm the changes you made?",
            }}
            footerProps={{
              children: (
                <div className="flex justify-end gap-2 mt-4">
                  <ActionButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsConfirmDialogOpen(false);
                    }}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    type="button"
                    loading={updateLoading || approvalPending}
                    onClick={async () => {
                      if (pendingFormData) {
                        isConfirmedRef.current = true;
                        await onSubmit(pendingFormData, false);
                        setIsConfirmDialogOpen(false);
                      }
                    }}
                  >
                    Confirm
                  </ActionButton>
                </div>
              ),
            }}
          />
        </form>
      </div>
    </div>
  );
};

export default SpaceEditPage;
