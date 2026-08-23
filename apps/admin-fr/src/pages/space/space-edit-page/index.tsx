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
import {
  spaceSchema,
  type SpaceSchema,
} from "@pride-spaces/common/utils/schemas/space.js";
import { datifyObjectValues } from "@/utils/object/datify";
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

const defaultTime = moment().hour(0).minute(0).toDate();

const SpaceEditPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const isConfirmedRef = useRef(false);
  const seatsHasPressedEnter = useRef(false);
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

      return {
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
      ...mainChanges.allData,
      ...(locationChanges.allFields.length
        ? {
            location: {
              ...res?.data?.data?.location,
              ...locationChanges.allData,
            },
          }
        : {}),
      ...(personChanges.allFields.length
        ? {
            person: {
              ...res?.data?.data?.person,
              ...personChanges.allData,
            },
          }
        : {}),
      ...(pricingChanges.allFields.length
        ? {
            pricing: {
              ...res?.data?.data?.pricing,
              ...pricingChanges.allData,
            },
          }
        : {}),
    };
  }, [
    mainChanges.allData,
    locationChanges.allData,
    locationChanges.allFields.length,
    personChanges.allData,
    personChanges.allFields.length,
    pricingChanges.allData,
    pricingChanges.allFields.length,
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      timing: {
        openDays: days.map((_, i) => i + 1).filter((_, i) => i < 6),
        openingDay: "Monday",
        closingDay: "Saturday",
        openTime: defaultTime,
        closeTime: defaultTime,
        operationalSince: undefined,
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
        isOc: false,
        isSez: false,
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
  const selectedGrade = watch("specs.grade");
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
    if (!selectedGrade) return;
    if (selectedGrade === "A+" || selectedGrade === "A") {
      // Grade A+/A => Always OC
      setValue("flags.isOc", true);

      // Optional: reset SEZ if needed
      // setValue("flags.isSez", false);
    }

    if (selectedGrade === "B") {
      // Grade B => Not SEZ
      setValue("flags.isSez", false);
    }
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
          refetch();
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
        const oldFiles = watch("files", {});
        setValue("files", {
          ...oldFiles,
          [`${fileType}s`]: [
            ...(oldFiles?.[`${fileType}s`] || []),
            resFile.filename,
          ],
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
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {isOperatorPortal && (
          <ActionButton
            type="button"
            variant="ghost"
            className="mb-2 gap-2 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(homeRoute)}
          >
            <ArrowLeft className="size-4" />
            Back to Portal
          </ActionButton>
        )}
        <div className="flex justify-between items-center my-4">
          <h1 className="text-2xl font-bold  w-full">
            Edit Centre: {watch("name", "")}
          </h1>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto py-8">
        {isDump && locData?.comment && (
          <div className="mb-5 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
              <MessageSquareWarning className="size-4" />
              Correction requested
            </div>
            <p className="leading-relaxed text-amber-50/90">
              {locData.comment}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit((data, e) => onSubmit(data))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const target = e.target as HTMLElement;
              if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
                const input = target as HTMLInputElement;
                const fieldName = input.name;
                if (input.id === "availableSeats") {
                  return;
                }
                e.preventDefault();
                e.stopPropagation();
                if (fieldName) {
                  activeInputHasPressedEnter.current[fieldName] = true;
                }
                input.blur();
              }
            } else if (e.key === "Escape") {
              const target = e.target as HTMLElement;
              if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
                const input = target as HTMLInputElement;
                e.preventDefault();
                e.stopPropagation();
                input.blur();
              }
            }
          }}
          className="auto-form-grid"
        >
          {/* SECTION: Centre Details */}

          <FormSectionTitle>Centre Details</FormSectionTitle>

          <FormField
            label="Centre Name"
            labelPosition="embedded"
            placeholder="My Centre"
            {...registerWithAutoSave("name")}
            error={errors.name}
            {...changedFieldProps(mainChanges.allData, "name")}
          />

          <FormField
            label="Slug"
            labelPosition="embedded"
            placeholder="my-centre-slug"
            disabled
            readOnly
            {...registerWithAutoSave("slug")}
            error={errors.slug}
            {...changedFieldProps(mainChanges.allData, "slug")}
          />

          <FormField
            label="Operator"
            labelPosition="embedded"
            value={operatorData?.name || "None"}
            readOnly
            disabled
            error={errors.operator}
            {...changedFieldProps(mainChanges.allData, "operator")}
          />

          <FormField
            key={`space-cat-${defaultValues?.specs?.category}`}
            label="Category"
            labelPosition="embedded"
            inputType="select"
            items={spaceCategories.map((cat) => ({ label: cat, value: cat }))}
            error={errors.specs?.category}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.category,
                onValueChange: (val) => {
                  setValue(
                    "specs.category",
                    val as SpaceSchema["specs"]["category"],
                    {
                      shouldValidate: true,
                    },
                  );
                  autoSave();
                },
              },
            }}
            {...changedFieldProps(mainChanges.allData, "category")}
          />

          <FormField
            key={`space-type-${defaultValues?.specs?.spaceType}`}
            label="Space Type"
            labelPosition="embedded"
            inputType="select"
            items={labelledSpaceTypes}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.spaceType,
                onValueChange: (val) => {
                  setValue(
                    "specs.spaceType",
                    val as SpaceSchema["specs"]["spaceType"],
                    {
                      shouldValidate: true,
                    },
                  );
                  autoSave();
                },
              },
            }}
            error={errors.specs?.spaceType}
            {...changedFieldProps(mainChanges.allData, "spaceType")}
          />

          <FormField
            key={`space-grade-${defaultValues?.specs?.grade}`}
            label="Building Type"
            labelPosition="embedded"
            inputType="select"
            items={labelledSpaceGrades}
            error={errors.specs?.grade}
            pickerProps={{
              wrapperProps: {
                defaultValue: defaultValues?.specs?.grade,
                onValueChange: (val) => {
                  setValue(
                    "specs.grade",
                    val as SpaceSchema["specs"]["grade"],
                    {
                      shouldValidate: true,
                    },
                  );
                  autoSave();
                },
              },
            }}
            {...changedFieldProps(mainChanges.allData, "grade")}
          />

          {/* Sez or Oc based on grade */}
          {watch("specs.grade", "B") === "B" ? (
            <FormField
              key={`oc-status-${defaultValues?.flags?.isOc}`}
              label="OC / Non-OC"
              labelPosition="embedded"
              inputType="select"
              items={[true, false].map((v) => ({
                label: v ? "OC" : "Non-OC",
                value: v,
              }))}
              error={errors?.flags?.isOc}
              pickerProps={{
                wrapperProps: {
                  // @ts-ignore
                  defaultValue: defaultValues?.flags?.isOc || false,
                  onValueChange: (val) => {
                    setValue("flags.isOc", String(val) === "true", {
                      shouldValidate: true,
                    });
                    setValue("flags.isSez", false, {
                      shouldValidate: true,
                    });
                    autoSave();
                  },
                },
              }}
              {...changedFieldProps(mainChanges.allData, "grade")}
            />
          ) : (
            <FormField
              key={`sez-status-${defaultValues?.flags?.isSez}`}
              label="Sez / Non-Sez"
              labelPosition="embedded"
              inputType="select"
              items={[true, false].map((v) => ({
                label: v ? "Sez" : "Non-Sez",
                value: v,
              }))}
              error={errors?.flags?.isOc}
              pickerProps={{
                wrapperProps: {
                  // @ts-ignore
                  defaultValue: defaultValues?.flags?.isSez || false,
                  onValueChange: (val) => {
                    setValue("flags.isSez", String(val) === "true", {
                      shouldValidate: true,
                    });
                    setValue("flags.isOc", true, {
                      shouldValidate: true,
                    });
                    autoSave();
                  },
                },
              }}
              {...changedFieldProps(mainChanges.allData, "grade")}
            />
          )}

          {/* Opening Day */}
          {/* <FormField
            key={`opening-day-${watch("timing.openingDay")}`}
            label="Opening Day"
            labelPosition="embedded"
            inputType="select"
            items={days.map((d) => ({ label: d, value: d }))}
            error={errors.timing?.openingDay}
            pickerProps={{
              wrapperProps: {
                defaultValue: watch("timing.openingDay") || "Monday",
                onValueChange: (val) => {
                  setValue("timing.openingDay", val, {
                    shouldValidate: true,
                  });
                  const closeVal = watch("timing.closingDay") || "Saturday";
                  const startIdx = days.indexOf(val as (typeof days)[number]);
                  const endIdx = days.indexOf(
                    closeVal as (typeof days)[number],
                  );
                  if (startIdx !== -1 && endIdx !== -1) {
                    const range: number[] = [];
                    if (startIdx <= endIdx) {
                      for (let i = startIdx; i <= endIdx; i++)
                        range.push(i + 1);
                    } else {
                      for (let i = startIdx; i < days.length; i++)
                        range.push(i + 1);
                      for (let i = 0; i <= endIdx; i++) range.push(i + 1);
                    }
                    setValue("timing.openDays", range, {
                      shouldValidate: true,
                    });
                  }
                  autoSave();
                },
              },
            }}
            {...changedFieldProps(mainChanges.allData, "openingDay")}
          /> */}

          {/* Open days */}
          <FormField
            label="Operational Days"
            labelPosition="embedded"
            // embeddedWrapperProps={{className: "max-w-full"}}
            error={{
              message: errors.timing?.openDays?.message,
              type: errors.timing?.openDays?.type || "validate",
            }}
            {...changedFieldProps(mainChanges.allData, "openDays")}
          >
            <GroupedSearchSelect
              key={`days-${defaultValues?.timing?.openDays?.length}`}
              type="multiple"
              showSearch={false}
              defaultSelected={
                defaultValues?.timing?.openDays ||
                days.map((_, i) => i + 1).filter((_, i) => i < 7)
              }
              items={days.map((dt, i) => ({
                label: dt,
                value: i + 1,
              }))}
              triggerProps={{
                children: (
                  <ActionButton
                    type="button"
                    variant={"outline"}
                    className={
                      "min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto justify-start"
                    }
                  >
                    {watch("timing.openDays", []).length > 0 ? (
                      <ChippedElements
                        className=""
                        elements={watch("timing.openDays", [])
                          .sort((a, b) => a - b)
                          .map((s) => shortDays[s - 1])
                          .filter((v) => !!v)}
                      />
                    ) : (
                      "Select Days"
                    )}
                  </ActionButton>
                ),
              }}
              contentProps={{ className: "max-h-[300px]" }}
              onSelect={(items) => {
                setValue(
                  "timing.openDays",
                  items.filter((val) => typeof val === "number"),
                  { shouldValidate: true },
                );
                autoSave();
              }}
            />
          </FormField>

          {/* Closing Day */}
          {/* <FormField
            key={`closing-day-${watch("timing.closingDay")}`}
            label="Closing Day"
            labelPosition="embedded"
            inputType="select"
            items={days.map((d) => ({ label: d, value: d }))}
            error={errors.timing?.closingDay}
            pickerProps={{
              wrapperProps: {
                defaultValue: watch("timing.closingDay") || "Saturday",
                onValueChange: (val) => {
                  setValue("timing.closingDay", val, {
                    shouldValidate: true,
                  });
                  const openVal = watch("timing.openingDay") || "Monday";
                  const startIdx = days.indexOf(
                    openVal as (typeof days)[number],
                  );
                  const endIdx = days.indexOf(val as (typeof days)[number]);
                  if (startIdx !== -1 && endIdx !== -1) {
                    const range: number[] = [];
                    if (startIdx <= endIdx) {
                      for (let i = startIdx; i <= endIdx; i++)
                        range.push(i + 1);
                    } else {
                      for (let i = startIdx; i < days.length; i++)
                        range.push(i + 1);
                      for (let i = 0; i <= endIdx; i++) range.push(i + 1);
                    }
                    setValue("timing.openDays", range, {
                      shouldValidate: true,
                    });
                  }
                  autoSave();
                },
              },
            }}
            {...changedFieldProps(mainChanges.allData, "closingDay")}
          /> */}

          {/* Open Time */}

          <FormField
            name="timing.openTime"
            label="Open Time"
            labelPosition="embedded"
            type="time"
            key={`open-time-${String(defaultValues?.timing?.openTime)}`}
            defaultValue={
              defaultValues?.timing?.openTime
                ? moment(defaultValues?.timing?.openTime).format("HH:mm")
                : undefined
            }
            onChange={(e) => {
              const val = e.currentTarget.value;
              setValue("timing.openTime", moment(val, "HH:mm", true).toDate(), {
                shouldValidate: true,
              });
            }}
            onBlur={() => {
              if (activeInputHasPressedEnter.current["timing.openTime"]) {
                autoSave();
              } else {
                revertAllFormFields();
              }
              activeInputHasPressedEnter.current["timing.openTime"] = false;
            }}
            error={errors.timing?.openTime}
            {...changedFieldProps(mainChanges.allData, "openTime")}
          />

          {/* Close Time */}

          <FormField
            name="timing.closeTime"
            label="Close Time"
            labelPosition="embedded"
            type="time"
            key={`close-time-${String(defaultValues?.timing?.closeTime)}`}
            defaultValue={
              defaultValues?.timing?.closeTime
                ? moment(defaultValues?.timing?.closeTime).format("HH:mm")
                : undefined
            }
            onChange={(e) => {
              const val = e.currentTarget.value;
              setValue(
                "timing.closeTime",
                moment(val, "HH:mm", true).toDate(),
                {
                  shouldValidate: true,
                },
              );
            }}
            onBlur={() => {
              if (activeInputHasPressedEnter.current["timing.closeTime"]) {
                autoSave();
              } else {
                revertAllFormFields();
              }
              activeInputHasPressedEnter.current["timing.closeTime"] = false;
            }}
            error={errors.timing?.closeTime}
            {...changedFieldProps(mainChanges.allData, "closeTime")}
          />

          <FormField
            label="Total Seats"
            labelPosition="embedded"
            type="number"
            {...registerWithAutoSave("seats.total", {
              valueAsNumber: true,
            })}
            error={errors.seats?.total}
            {...changedFieldProps(mainChanges.allData, "totalSeats")}
          />

          <FormField
            id="availableSeats"
            label="Available Seats"
            labelPosition="embedded"
            type="number"
            max={watch("seats.total", 0) ?? 0}
            min={0}
            value={
              (watch("seats.total", 0) ?? 0) - (watch("seats.booked", 0) ?? 0)
            }
            onChange={(e) => {
              const val = Number(e.currentTarget.value);
              const booked = (watch("seats.total", 0) ?? 0) - val;
              setValue("seats.booked", booked, { shouldValidate: true });
            }}
            onFocus={() => {
              seatsHasPressedEnter.current = false;
            }}
            onBlur={async (e) => {
              if (!seatsHasPressedEnter.current) {
                if (res?.data?.data) {
                  const currentBooked = res.data.data.seats?.booked ?? 0;
                  setValue("seats.booked", currentBooked, {
                    shouldValidate: true,
                  });
                }
              }
              seatsHasPressedEnter.current = false;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                seatsHasPressedEnter.current = true;
                const val = Number(e.currentTarget.value);
                const booked = (watch("seats.total", 0) ?? 0) - val;
                const currentBooked = res?.data?.data?.seats?.booked;
                if (booked !== currentBooked) {
                  const latestData = watch();
                  setPendingFormData({
                    ...latestData,
                    seats: {
                      ...latestData.seats,
                      booked,
                    },
                  });
                  isConfirmedRef.current = false;
                  setIsConfirmDialogOpen(true);
                }
                e.currentTarget.blur();
              }
            }}
            error={errors.seats?.booked}
            {...changedFieldProps(mainChanges.allData, "seats")}
          />

          <FormField
            label="Occupancy (%)"
            labelPosition="embedded"
            value={`${
              (watch("seats.total") || 0) > 0
                ? (
                    ((watch("seats.booked") || 0) /
                      (watch("seats.total") || 1)) *
                    100
                  ).toFixed(2)
                : "0.00"
            }%`}
            readOnly
            disabled
          />

          {/* Amenities */}
          <FormField
            label="Amenities"
            labelPosition="embedded"
            error={{
              message:
                errors.facilities?.[0]?.message || errors?.facilities?.message,
              type:
                errors.facilities?.[0]?.type ||
                errors?.facilities?.type ||
                "validate",
            }}
            {...changedFieldProps(mainChanges.allData, "facilities")}
          >
            <SelectAmenities
              className="grow-1 shrink-1 w-[200px] overflow-hidden overflow-x-auto justify-start"
              defaultAmenities={watch("facilities", [])}
              onSelect={(amenities) => {
                console.log(amenities);
                setValue(
                  "facilities",
                  // @ts-ignore
                  amenities.map((a) => a.id),
                  { shouldValidate: true },
                );
                autoSave();
              }}
            >
              {(watch("facilities", [])?.length || 0) > 0 ? (
                <ChippedElements
                  className=""
                  elements={amenitiesData
                    .filter((dt) => watch("facilities", [])?.includes(dt.id))
                    .map((dt) => dt.name)}
                />
              ) : (
                "Select Amenities"
              )}
            </SelectAmenities>
          </FormField>

          {/* Working Sizes */}
          <FormField
            label="Work Station Sizes"
            labelPosition="embedded"
            error={{
              message:
                errors.specs?.workingSizes?.[0]?.message ||
                errors?.specs?.workingSizes?.message,
              type:
                errors.specs?.workingSizes?.[0]?.type ||
                errors?.specs?.workingSizes?.type ||
                "validate",
            }}
            {...changedFieldProps(mainChanges.allData, "workingSizes")}
          >
            <GroupedSearchSelect
              key={`working-sizes-${defaultValues?.specs?.workingSizes?.length}`}
              type="multiple"
              showSearch={false}
              defaultSelected={defaultValues?.specs?.workingSizes}
              items={labelledWorkingSizes}
              triggerProps={{
                children: (
                  <ActionButton
                    type="button"
                    variant={"outline"}
                    className={
                      "min-h-[40px] grow-1 shrink-1 border-0 w-[200px] overflow-hidden overflow-x-auto"
                    }
                  >
                    {(watch("specs.workingSizes", [])?.length || 0) > 0 ? (
                      <ChippedElements
                        elements={watch("specs.workingSizes", [])?.map(
                          // (s) => s + " mm",
                          (s) => getDenotedWorkingSize(s),
                        )}
                      />
                    ) : (
                      "Select Working Sizes"
                    )}
                  </ActionButton>
                ),
              }}
              contentProps={{ className: "max-h-[300px]" }}
              onSelect={(items) => {
                setValue(
                  "specs.workingSizes",
                  items.filter(
                    (val) => typeof val === "string",
                  ) as WorkingSize[],
                  { shouldValidate: true },
                );
                autoSave();
              }}
            />
          </FormField>

          {/* Operational Since (year) */}
          <FormField
            label="Operational Since (year)"
            labelPosition="embedded"
            placeholder="2024"
            type="number"
            {...registerWithAutoSave("timing.operationalSince", {
              valueAsNumber: true,
            })}
            error={errors.timing?.operationalSince}
            {...changedFieldProps(mainChanges.allData, "operationalSince")}
          />

          {/* Area in sq.ft */}
          <FormField
            label="Centre Area In Sq. Ft. (approx)"
            labelPosition="embedded"
            placeholder="500"
            type="number"
            inputMode="decimal"
            min={0}
            {...registerWithAutoSave("specs.area", { valueAsNumber: true })}
            error={errors.specs?.area}
            {...changedFieldProps(mainChanges.allData, "area")}
          />

          {/* Pricing Details */}
          <FormSectionTitle>Pricing Details</FormSectionTitle>
          <FormField
            label="Day Pass"
            labelPosition="embedded"
            placeholder="300"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...registerWithAutoSave("pricing.dayPass", {
              valueAsNumber: true,
            })}
            error={errors.pricing?.dayPass}
            {...changedFieldProps(pricingChanges.allData, "dayPass")}
          />
          <FormField
            label="Meeting Room"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...registerWithAutoSave("pricing.meetingRoom", {
              valueAsNumber: true,
            })}
            error={errors.pricing?.meetingRoom}
          />
          <FormField
            label="Dedicated Desk"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...registerWithAutoSave("pricing.dedicatedDesk", {
              valueAsNumber: true,
            })}
            error={errors.pricing?.dedicatedDesk}
            {...changedFieldProps(pricingChanges.allData, "dedicatedDesk")}
          />
          <FormField
            label="Flexi/Hot Desk"
            labelPosition="embedded"
            placeholder="3000"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...registerWithAutoSave("pricing.flexiDesk", {
              valueAsNumber: true,
            })}
            error={errors.pricing?.flexiDesk}
          />
          <FormField
            label="Per Seat"
            labelPosition="embedded"
            placeholder="300"
            type="number"
            inputMode="decimal"
            min={0}
            max={99999}
            {...registerWithAutoSave("pricing.perSeat", {
              valueAsNumber: true,
            })}
            error={errors.pricing?.perSeat}
            {...changedFieldProps(pricingChanges.allData, "perSeat")}
          />
          <FormField
            key={`vo-service-${watch("flags.isVoService")}`}
            label="VO Service"
            labelPosition="embedded"
            inputType="select"
            items={[
              { label: "YES", value: "true" },
              { label: "NO", value: "false" },
            ]}
            error={errors?.flags?.isVoService}
            pickerProps={{
              wrapperProps: {
                value: watch("flags.isVoService") ? "true" : "false",
                onValueChange: (val) => {
                  const isYes = val === "true";
                  setValue("flags.isVoService", isYes, {
                    shouldValidate: true,
                  });
                  if (!isYes) {
                    setValue("pricing.vo", 0, { shouldValidate: true });
                  }
                  autoSave();
                },
              },
            }}
          />
          {watch("flags.isVoService") && (
            <FormField
              label="VO Price Per month"
              labelPosition="embedded"
              placeholder="3000"
              type="number"
              inputMode="decimal"
              min={0}
              max={99999}
              {...registerWithAutoSave("pricing.vo", { valueAsNumber: true })}
              error={errors.pricing?.vo}
            />
          )}

          {/* Terms & Conditions */}
          <FormSectionTitle>Terms & Conditions</FormSectionTitle>
          <FormField
            label="Lock In"
            labelPosition="embedded"
            placeholder="e.g. 1 Year / 6 Months"
            {...registerWithAutoSave("terms.lockIn")}
            error={errors.terms?.lockIn}
          />
          <FormField
            label="Notice Period"
            labelPosition="embedded"
            placeholder="e.g. 3 Months"
            {...registerWithAutoSave("terms.noticePeriod")}
            error={errors.terms?.noticePeriod}
          />
          <FormField
            label="Security Deposit"
            labelPosition="embedded"
            placeholder="e.g. 3 Months Rent"
            {...registerWithAutoSave("terms.securityDeposit")}
            error={errors.terms?.securityDeposit}
          />

          {/* Location */}
          <FormSectionTitle>Location Details</FormSectionTitle>

          <FormField
            label="Location URL"
            labelPosition="embedded"
            placeholder="https://maps.app.goo.gl/..."
            {...registerWithAutoSave("location.url")}
            error={errors.location?.url}
            {...changedFieldProps(locationChanges.allData, "url")}
          />

          <FormField
            label="City"
            labelPosition="embedded"
            placeholder="Mumbai"
            {...registerWithAutoSave("location.city")}
            error={errors.location?.city}
            {...changedFieldProps(locationChanges.allData, "city")}
          />

          <FormField
            label="State"
            labelPosition="embedded"
            placeholder="Maharashtra"
            {...registerWithAutoSave("location.state")}
            error={errors.location?.state}
            {...changedFieldProps(locationChanges.allData, "state")}
          />

          <FormField
            label="Country"
            labelPosition="embedded"
            placeholder="India"
            {...registerWithAutoSave("location.country")}
            error={errors.location?.country}
            {...changedFieldProps(locationChanges.allData, "country")}
          />

          <FormField
            label="Area - Micro Market"
            labelPosition="embedded"
            placeholder="Panvel"
            {...registerWithAutoSave("location.area")}
            error={errors.location?.area}
            {...changedFieldProps(locationChanges.allData, "area")}
          />

          <FormField
            label="Zip Code"
            labelPosition="embedded"
            placeholder="349203"
            {...registerWithAutoSave("location.postalCode")}
            error={errors.location?.postalCode}
            {...changedFieldProps(locationChanges.allData, "postalCode")}
          />

          <FormField
            label="Latitude"
            labelPosition="embedded"
            type="number"
            step="any"
            {...registerWithAutoSave("location.lat")}
            error={errors.location?.lat}
            {...changedFieldProps(locationChanges.allData, "lat")}
          />

          <FormField
            label="Longitude"
            labelPosition="embedded"
            type="number"
            step="any"
            {...registerWithAutoSave("location.lng")}
            error={errors.location?.lng}
            {...changedFieldProps(locationChanges.allData, "lng")}
          />

          {/* Maps */}
          <MapsField
            wrapperProps={{ className: "col-span-full flex flex-col gap-4" }}
            mapProps={{ mapContainerClassName: "min-h-[300px] w-full" }}
            buttonProps={{ className: "w-fit" }}
            onGeocodeLatLng={(res, coords) => {
              console.log(res);
              const oldData = watch("location");
              const data: SpaceSchema["location"] = {
                address: res.address || oldData.address,
                city: res.city || oldData.city,
                state: res.state || oldData.state,
                postalCode: res.postalCode || oldData.postalCode,
                country: res.country || oldData.country,
                area: res.area || oldData.area,
                lat: coords.lat || oldData.lat,
                lng: coords.lng || oldData.lng,
              };
              setValue("location", data, { shouldValidate: true });
              autoSave();
            }}
            onLatLngFromURL={(stats) => {
              // console.log("Stats from maps url to pos :", stats);
              setValue("location.lat", stats.lat);
              setValue("location.lng", stats.lng);
              setValue("location.url", stats.url, { shouldValidate: true });
              autoSave();
            }}
          />

          <FormField
            label="Address"
            labelPosition="embedded"
            inputType="textarea"
            {...registerWithAutoSave("location.address")}
            error={errors.location?.address}
            {...changedFieldProps(locationChanges.allData, "address")}
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

                setValue("files.images", [
                  ...(watch("files.images", []) || []),
                  fileRes.data.data.files?.[0]?.filename,
                ]);
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

                setValue("files.layouts", [
                  ...(watch("files.layouts", []) || []),
                  fileRes.data.data.files?.[0]?.filename,
                ]);

                // autoSave();
                return {
                  status: "completed",
                };
              } catch (err) {
                return { status: "error" };
              }
            }}
          />

          {/* SECTION: Centre Point of Contact */}

          <FormSectionTitle>Point of Contact Details</FormSectionTitle>

          <FormField
            label="Name"
            labelPosition="embedded"
            placeholder="John Doe"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            {...registerWithAutoSave("person.name")}
            error={errors?.person?.name}
            {...changedFieldProps(personChanges.allData, "name")}
          />

          <FormField
            label="Email"
            labelPosition="embedded"
            type="email"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            placeholder="john.doe@example.com"
            {...registerWithAutoSave("person.email")}
            error={errors?.person?.email}
            {...changedFieldProps(personChanges.allData, "email")}
          />

          <FormField
            name="person.contactNo"
            key={`poc-same-${POCSameAsOperator}-${defaultValues?.person?.contactNo}`}
            label="Telephone"
            labelPosition="embedded"
            type="tel"
            inputMode="tel"
            inputType="phone"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            defaultValue={defaultValues?.person?.contactNo}
            value={watch("person.contactNo")}
            {...changedFieldProps(personChanges.allData, "contactNo")}
            placeholder="+1-123-456-7890"
            onChange={(val) => {
              console.log("POC contact number:", val);
              setValue("person.contactNo", val?.toString() || "", {
                shouldValidate: true,
              });
            }}
            onBlur={() => {
              if (activeInputHasPressedEnter.current["person.contactNo"]) {
                autoSave();
              } else {
                revertAllFormFields();
              }
              activeInputHasPressedEnter.current["person.contactNo"] = false;
            }}
            error={errors?.person?.contactNo}
          />

          <FormField
            label="Designation"
            placeholder="Centre Manager"
            labelPosition="embedded"
            readOnly={POCSameAsOperator}
            disabled={POCSameAsOperator}
            {...registerWithAutoSave("person.role")}
            error={errors?.person?.role}
            {...changedFieldProps(personChanges.allData, "role")}
          />

          {/* Status */}
          <div className="col-span-full flex gap-8">
            <div className="flex items-center gap-4">
              <label className="text-muted-foreground text-sm">Active</label>
              <Switch
                key={watch("flags.isActive") ? "active" : "inactive"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400/60"
                checked={!!watch("flags.isActive")}
                onCheckedChange={(checked) => {
                  setValue("flags.isActive", checked, { shouldValidate: true });
                  autoSave();
                }}
              />
            </div>

            <div className="flex items-center  gap-4">
              <label className="text-muted-foreground text-sm">Verified</label>
              <Switch
                key={watch("flags.isVerified") ? "verified" : "unverified"}
                checked={!!watch("flags.isVerified")}
                onCheckedChange={(checked) => {
                  setValue("flags.isVerified", checked, {
                    shouldValidate: true,
                  });
                  autoSave();
                }}
              />
            </div>
            {selectedGrade === "B" && (
              <div className="flex items-center gap-4">
                <label className="text-muted-foreground text-sm">OC</label>
                <Switch
                  key={watch("flags.isOc") ? "oc" : "non-oc"}
                  checked={!!watch("flags.isOc")}
                  onCheckedChange={(checked) => {
                    setValue("flags.isOc", checked, { shouldValidate: true });
                    autoSave();
                  }}
                />
              </div>
            )}

            {(selectedGrade === "A" || selectedGrade === "A+") && (
              <div className="flex items-center gap-4">
                <label className="text-muted-foreground text-sm">SEZ</label>
                <Switch
                  key={watch("flags.isSez") ? "sez" : "non-sez"}
                  checked={!!watch("flags.isSez")}
                  onCheckedChange={(checked) => {
                    setValue("flags.isSez", checked, { shouldValidate: true });
                    autoSave();
                  }}
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="text-muted-foreground text-sm">
                Same As Operator
              </label>
              <Switch
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400/60"
                checked={POCSameAsOperator}
                onCheckedChange={(checked) => {
                  setPOCSameAsOperator(checked);
                  autoSave();
                }}
              />
            </div>
          </div>
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

          {/* Delete trigger */}
          <div className="col-span-full flex justify-end pt-4 gap-2">
            <DialogModal
              triggerProps={{
                children: (
                  <ActionButton
                    type="button"
                    variant={"destructive"}
                    loading={updateLoading}
                    className="max-w-fit"
                  >
                    Move to bin
                  </ActionButton>
                ),
              }}
              titleProps={{ children: "Centre Delete Confirmation" }}
              descriptionProps={{
                children:
                  "Are you sure to delete this centre ? You cannot undo this action.",
              }}
            >
              <ActionButton variant={"destructive"}>Move to bin</ActionButton>
            </DialogModal>
            <ActionButton loading={updateLoading} type="submit">
              <div className="flex items-center gap-2">
                Save Changes <Save />
              </div>
            </ActionButton>
          </div>

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
