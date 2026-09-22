import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { ArrowLeft, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ActionButton from "@/components/buttons/action-btn";
import { createSpace as createAdminSpace } from "@/services/apis/admin/spaces";
import { createSpace as createOperatorSpace } from "@/services/apis/operator/spaces";
import { useUser } from "@/services/hooks/use-user";
import {
  spaceSchema,
  type SpaceSchema,
} from "@pride-spaces/common/utils/schemas/space.js";
import { generateSlug } from "@/utils/string/slug";
import { queryKeys } from "@/utils/query-keys";
import { days } from "@/utils/data/days";
import type { Operator } from "@/types/data/operators";
import { validateNumber } from "@/utils/number";
import { getOperators } from "@/services/apis/admin/operators";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { getMapsURLPos } from "@/services/apis/general/location";
import { uploadImageFile, uploadLayoutFile } from "@/services/apis/admin/file";
import type { UploadedFile } from "@/components/form/file-upload";
import {
  mediaTypes,
  type MediaType,
} from "@pride-spaces/common/utils/data/media.js";
import { cn } from "@/utils/className";

// Form Sections
import SpaceDetailsSection from "@/containers/space/section/space-details";
import SpacePocDetailsSection from "@/containers/space/section/space-poc-details";
import SpaceCertificationsSection from "@/containers/space/section/space-certifications";
import SpaceAmenitiesSection from "@/containers/space/section/space-amenities";
import SpacePricingDetailsSection from "@/containers/space/section/space-pricing-details";
import SpaceLocationDetailsSection from "@/containers/space/section/space-location-details";
import SpaceImagesUploadSection from "@/containers/space/section/image-upload";
import SpaceLayoutsUploadSection from "@/containers/space/section/layout-upload";

const defaultTime = moment().hour(0).minute(0).toDate();

type LocState = {
  operatorData: Operator | null;
};

const SpaceCreatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userLevel, userData } = useUser();

  const formRef = useRef<HTMLFormElement | null>(null);

  const formReturns = useForm({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      timing: {
        openDays: days.map((_, i) => i + 1).filter((_, i) => i < 6),
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
        isOc: "!",
        isSez: "!",
        isVoService: false,
        isEventSpace: false,
      },

      pricing: {
        dayPass: 0,
        perSeat: 0,
        dedicatedDesk: 0,
        flexiDesk: 0,
        privateCabin: 0,
        meetingRoom: 0,
        vo: 0,
        eventSpaceBrief: "",
        eventSpaceCharges: "",
        eventSpaceCapacity: undefined,
      },
    },
  });

  const {
    handleSubmit,
    formState: { defaultValues },
    watch,
    setValue,
  } = useMemo(() => formReturns, [formReturns]);

  // Operator related states
  const isOperatorPortal = userLevel === "operator";
  const loggedInOperator = isOperatorPortal
    ? (userData as Operator | null)
    : null;

  const { operatorData: locationOperatorData } = useMemo(() => {
    const state = location.state as Partial<LocState> | null | undefined;
    return state || {};
  }, [location.state]);

  const [selectedOperatorData] =
    useState<Operator | null>(loggedInOperator || locationOperatorData || null);

  // operators list fetch
  const { data: operatorsRes } = useQuery({
    queryKey: [queryKeys.OPERATORS, "space-create"],
    queryFn: () =>
      getOperators({
        query: {
          page: 1,
          limit: 1000,
          sortBy: "name",
          sortOrder: "asc",
        },
      }),
    enabled: !locationOperatorData && !isOperatorPortal,
  });

  const operators = useMemo(
    () =>
      ((operatorsRes?.data?.data?.results ?? []) as Operator[]).filter(Boolean),
    [operatorsRes?.data?.data?.results],
  );

  const operatorData = useMemo(() => {
    return (
      loggedInOperator ||
      selectedOperatorData ||
      locationOperatorData ||
      operators?.find((op) => op.id === watch("operator", "")) ||
      null
    );
  }, [
    loggedInOperator,
    selectedOperatorData,
    locationOperatorData,
    operators,
    watch("operator"),
  ]);

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

  const [POCSameAsOperator, setPOCSameAsOperator] = useState(false);

  // Sync operator details when selected
  useEffect(() => {
    if (!operatorData) return;
    const primaryBranch =
      operatorData?.branches?.find((branch) => branch.isPrimary) ||
      operatorData?.branches?.[0];

    if (operatorData.id) {
      setValue("operator", operatorData.id, { shouldValidate: true });
    }
    if (primaryBranch?.code) {
      setValue("branch", primaryBranch.code, { shouldValidate: true });
    }
    if (operatorData.slug) {
      setValue(
        "slug",
        generateSlug(
          operatorData.slug,
          validateNumber(operatorData.totalSpaces, {
            invalidValue: -1,
          }) + 1,
        ),
        { shouldValidate: true },
      );
    }
  }, [operatorData, setValue]);

  // Sync POC details when "Same As Operator" is toggled
  useEffect(() => {
    if (POCSameAsOperator && operatorData?.person) {
      setValue(
        "person",
        {
          name: operatorData.person.name || "",
          email: operatorData.person.email || "",
          contactNo: operatorData.person.contactNo || "",
          role: operatorData.person.role || "",
        },
        { shouldValidate: true },
      );
    }
  }, [POCSameAsOperator, operatorData, setValue]);

  const createSpaceApi = isOperatorPortal
    ? createOperatorSpace
    : createAdminSpace;
  const homeRoute = isOperatorPortal ? "/partner" : "/spaces";

  const { mutateAsync, isPending: createLoading } = useMutation({
    mutationFn: (body: SpaceSchema) =>
      createSpaceApi({ body: body as any }),
  });

  const { mutateAsync: mapsURLPosMutater } = useMutation({
    mutationFn: (
      body: (Required<Parameters<typeof getMapsURLPos>[0]> & {})["body"],
    ) => getMapsURLPos({ body }),
  });

  // 2 secs debounced maps url set
  useDebouncer(watch("location.url"), 2000, async (url) => {
    try {
      if (
        url?.trim() &&
        spaceSchema.shape.location.shape.url.safeParse(url).success
      ) {
        const res = await mapsURLPosMutater({ url });
        const data = res.data?.data;
        if (data?.lat && data?.lng) {
          setValue("location.lat", data.lat);
          setValue("location.lng", data.lng);
        }
      }
    } catch (err) {
      console.error("Error location url debouncer :", err);
    }
  });

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

  const onSubmit = async (body: SpaceSchema) => {
    try {
      console.log("Centre body", body);

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

      const res = await mutateAsync(body);

      if (res.status === 201) {
        toast.success("Centre created successfully");
        navigate(homeRoute);
        return;
      }

      throw new Error("Invalid response");
    } catch {
      toast.error("Failed to create centre");
    }
  };

  return (
    <div className="container mx-auto p-6">
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
            Add Centre: {watch("name", "")}
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
            loading={createLoading}
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
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Space create form error", errors);
          })}
          className="auto-form-grid"
        >
          {/* SECTION: Centre Details */}
          <SpaceDetailsSection
            formProps={formReturns}
            operatorData={operatorData}
            operators={operators}
            timeOptions={timeOptions}
            hasLoadedData={false}
            isNew={!isOperatorPortal && !locationOperatorData}
          />

          {/* SECTION: Centre Point of Contact */}
          <SpacePocDetailsSection
            formProps={formReturns}
            pocSameAsOperator={POCSameAsOperator}
            setPOCSameAsOperator={setPOCSameAsOperator}
          />

          {/* SECTION: Certifications */}
          <SpaceCertificationsSection formProps={formReturns} />

          {/* SECTION: Amenities & Event Space Details */}
          <SpaceAmenitiesSection formProps={formReturns} />

          {/* Pricing Details */}
          <SpacePricingDetailsSection
            formProps={formReturns}
            isMos={isMos}
          />

          {/* Location Section */}
          <SpaceLocationDetailsSection
            formProps={formReturns}
            operatorData={operatorData}
          />

          {/* Images */}
          <SpaceImagesUploadSection
            existingFiles={defaultValues?.files?.images?.filter(
              (s) => typeof s === "string",
            )}
            processUpload={async (file) => {
              try {
                const fileRes = await handleFileUpload(file, mediaTypes.IMAGE);
                if (!fileRes) {
                  throw new Error("Incomplete");
                }
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
            processUpload={async (file) => {
              try {
                const fileRes = await handleFileUpload(file, mediaTypes.LAYOUT);
                if (!fileRes) {
                  throw new Error("Incomplete");
                }
                return {
                  status: "completed",
                };
              } catch (err) {
                return { status: "error" };
              }
            }}
          />
        </form>
      </div>
    </div>
  );
};

export default SpaceCreatePage;
