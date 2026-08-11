import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Pencil,
  ShieldCheck,
  Users,
  Percent,
  Ruler,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUser } from "@/services/hooks/use-user";
import SpacesTabledResults from "@/containers/spaces-table";
import ActionButton from "@/components/buttons/action-btn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils/className";
import type { DatifiedOperator } from "@/types/data/operators";
import { getSpaces as getOperatorSpaces } from "@/services/apis/operator/spaces";
import { queryKeys } from "@/utils/query-keys";
import type { Space } from "@/types/data/spaces";

const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 p-3.5">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="size-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
        {value || "—"}
      </p>
    </div>
  </div>
);

const formatCompactArea = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.?0+$/, "")}K`;
  }
  return value.toLocaleString("en-IN");
};

export default function OperatorHome() {
  const navigate = useNavigate();
  const { userData, isFetching } = useUser();
  const operator = userData as DatifiedOperator | null;
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  const { data: spacesRes, isLoading: isSpacesLoading } = useQuery({
    queryKey: [queryKeys.SPACES, "all-stats", operator?.id],
    queryFn: () =>
      getOperatorSpaces({
        query: {
          limit: 1000,
          operator: operator?.id || "",
        },
      }),
    enabled: !!operator?.id,
  });

  const spaces = useMemo(
    () => (spacesRes?.data?.data?.results ?? []) as Space[],
    [spacesRes],
  );

  const totalSeats = useMemo(
    () => spaces.reduce((acc, space) => acc + (space.seats?.total ?? 0), 0),
    [spaces],
  );

  const bookedSeats = useMemo(
    () => spaces.reduce((acc, space) => acc + (space.seats?.booked ?? 0), 0),
    [spaces],
  );

  const occupancyPercent = useMemo(() => {
    if (totalSeats === 0) return 0;
    return Math.round((bookedSeats / totalSeats) * 100);
  }, [totalSeats, bookedSeats]);

  const totalArea = useMemo(
    () => spaces.reduce((acc, space) => acc + (space.specs?.area ?? 0), 0),
    [spaces],
  );

  const uniqueCitiesCount = useMemo(() => {
    if (!operator?.branches) return 0;
    return new Set(
      operator.branches
        .map((b) => b.city?.trim())
        .filter(Boolean)
    ).size;
  }, [operator?.branches]);

  const stats = useMemo(
    () => [
      {
        label: "Total Centres",
        value: isSpacesLoading
          ? "..."
          : (spacesRes?.data?.data?.metrics?.total ?? operator?.totalSpaces ?? 0),
        icon: Building2,
        accent: "from-teal-500/15 to-emerald-500/10",
      },
      {
        label: "Cities",
        value: uniqueCitiesCount,
        icon: MapPin,
        accent: "from-cyan-500/15 to-teal-500/10",
      },
      {
        label: "Total Seats",
        value: isSpacesLoading ? "..." : totalSeats.toLocaleString("en-IN"),
        icon: Users,
        accent: "from-violet-500/15 to-purple-500/10",
      },
      {
        label: "Total Area (Sq. Ft.)",
        value: isSpacesLoading ? "..." : formatCompactArea(totalArea),
        icon: Ruler,
        accent: "from-indigo-500/15 to-blue-500/10",
      },
      {
        label: "Occupancy Percentage",
        value: isSpacesLoading ? "..." : `${occupancyPercent}%`,
        icon: Percent,
        accent: "from-amber-500/15 to-orange-500/10",
      },
      {
        label: "Account Status",
        value: operator?.isActive ? "Active" : "Inactive",
        icon: ShieldCheck,
        accent: operator?.isActive
          ? "from-emerald-500/15 to-green-500/10"
          : "from-red-500/15 to-orange-500/10",
      },
    ],
    [
      operator,
      uniqueCitiesCount,
      isSpacesLoading,
      spacesRes,
      totalSeats,
      occupancyPercent,
      totalArea,
    ],
  );

  if (isFetching && !operator?.id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero */}
      <section className="operator-hero mb-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-1 text-2xl font-black text-primary-foreground shadow-lg shadow-primary/25">
              {(operator?.brandName || operator?.name || "S")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Globe className="size-3" />
                  Space Partner
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                    operator?.isActive
                      ? "bg-emerald-500/15 text-emerald-700"
                      : "bg-red-500/15 text-red-700",
                  )}
                >
                  {operator?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {operator?.brandName || operator?.name || "Your Business"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {operator?.name && operator?.brandName !== operator?.name
                  ? operator.name
                  : "Manage your centres and business profile"}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 flex-col gap-2 self-start sm:flex-row md:self-center">
            <ActionButton
              variant="outline"
              className="h-11 gap-2 border-border/60 bg-card/80 backdrop-blur-sm hover:bg-card"
              onClick={() =>
                navigate(`/partner/${operator?.id}`, {
                  state: { from: "partner" },
                })
              }
            >
              <Pencil className="size-4" />
              Edit Details
            </ActionButton>

            {/* <ActionButton
              className="h-11 gap-2 shadow-md shadow-primary/20"
              onClick={() =>
                navigate("/spaces/new", {
                  state: { operatorData: operator },
                })
              }
            >
              <Plus className="size-4" />
              Add Centre
            </ActionButton> */}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={cn(
              "overflow-hidden border-border/60 bg-gradient-to-br py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
              stat.accent,
            )}
          >
            <CardContent className="flex items-center gap-3 px-4 py-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                <stat.icon className="size-4 sm:size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] sm:text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="truncate text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Operator Details */}
      <section className="mb-10">
        <Card className="border-border/60 shadow-sm transition-all duration-200">
          <CardHeader className={cn("pb-4", isProfileExpanded && "border-b border-border/40")}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Business Profile</CardTitle>
                <CardDescription>
                  Your registered operator information on Pride Spaces
                </CardDescription>
              </div>
              <ActionButton
                variant="outline"
                className="h-9 gap-1.5 px-3 border-border/60 hover:bg-muted/50"
                onClick={() => setIsProfileExpanded((prev) => !prev)}
              >
                {isProfileExpanded ? (
                  <>

                    <ChevronUp className="size-4" />
                  </>
                ) : (
                  <>

                    <ChevronDown className="size-4" />
                  </>
                )}
              </ActionButton>
            </div>
          </CardHeader>
          {isProfileExpanded && (
            <CardContent className="pt-5 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem icon={Mail} label="Email" value={operator?.email} />
                <InfoItem
                  icon={Phone}
                  label="POC Contact"
                  value={operator?.person?.contactNo}
                />
                <InfoItem
                  icon={Users}
                  label="POC Name"
                  value={operator?.person?.name}
                />
                <InfoItem
                  icon={Building2}
                  label="GST Number"
                  value={operator?.gstNo}
                />
                <InfoItem
                  icon={MapPin}
                  label="HQ Address"
                  value={operator?.headquarter?.address}
                />
                <InfoItem
                  icon={Phone}
                  label="HQ Contact"
                  value={operator?.headquarter?.contactNo}
                />
              </div>

              {operator?.branches && operator.branches.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Registered Branches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {operator.branches.map((branch) => (
                      <span
                        key={branch.code}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-3 py-1.5 text-xs font-medium"
                      >
                        <MapPin className="size-3 text-primary" />
                        {branch.name}
                        {branch.isPrimary && (
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            Primary
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </section>

      {/* Centres */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">My Centres</h2>
            <p className="text-sm text-muted-foreground">
              View and manage all centres under your operator account
            </p>
          </div>
          <ActionButton
            variant="outline"
            className="gap-2 self-start"
            onClick={() =>
              navigate("/spaces/new", {
                state: { operatorData: operator },
              })
            }
          >
            <Plus className="size-4" />
            List New Centre
          </ActionButton>
        </div>

        <Card className="border-border/60 p-4 shadow-sm sm:p-6">
          <SpacesTabledResults
            operatorId={operator?.id ?? null}
            id={null}
            pagination
            tableWrapperProps={{}}
            tableProps={{ className: "admin-data-table" }}
            tableHeaderProps={{}}
            tableBodyProps={{}}
            tableRowProps={{}}
            tableHeadProps={{}}
            tableCellProps={{}}
            skeletonProps={{}}
            prevButtonProps={{}}
            nextButtonProps={{}}
            inputProps={{ className: "admin-search-input" }}
          />
        </Card>
      </section>
    </div>
  );
}
