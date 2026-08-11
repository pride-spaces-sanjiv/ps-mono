import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  DoorOpen,
  Factory,
  MapPinned,
  MessageSquareText,
  PieChart,
  PlusCircle,
  Ruler,
  Star,
  Users,
} from "lucide-react";
import {
  getAnalytics,
  staticAnalyticsSummary,
} from "@/services/apis/admin/analytics";
import { queryKeys } from "@/utils/query-keys";

const numberFormatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatSqFt = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  return numberFormatter.format(value);
};

const getPercent = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const Dashboard = () => {
  const { data: analyticsRes } = useQuery({
    queryKey: [queryKeys.ANALYTICS],
    queryFn: () => getAnalytics(),
  });

  const analytics = analyticsRes?.data.data ?? staticAnalyticsSummary;
  const occupancy = getPercent(analytics.bookedSeats, analytics.totalSeats);
  const activeRate = getPercent(analytics.activeCentres, analytics.totalCentres);
  const verifiedRate = getPercent(
    analytics.verifiedCentres,
    analytics.totalCentres,
  );

  const summaryStats = useMemo(
    () => [
      {
        title: "Operators",
        value: formatCompact(analytics.totalOperators),
        helper: `+${analytics.newOperatorsThisMonth} this month`,
        icon: Factory,
        accent: "from-primary/30 to-primary/5",
        iconClassName: "bg-primary/15 text-primary",
      },
      {
        title: "Centres",
        value: formatCompact(analytics.totalCentres),
        helper: `+${analytics.newCentresThisMonth} this month`,
        icon: Building2,
        accent: "from-cyan-400/25 to-cyan-400/5",
        iconClassName: "bg-cyan-400/15 text-cyan-200",
      },
      {
        title: "Sq. Ft.",
        value: formatSqFt(analytics.totalSqFt),
        helper: "Managed footprint",
        icon: Ruler,
        accent: "from-emerald-400/25 to-emerald-400/5",
        iconClassName: "bg-emerald-400/15 text-emerald-200",
      },
      {
        title: "Cities",
        value: formatCompact(analytics.totalCities),
        helper: "Covered markets",
        icon: MapPinned,
        accent: "from-amber-400/25 to-amber-400/5",
        iconClassName: "bg-amber-400/15 text-amber-200",
      },
      {
        title: "Total Seats",
        value: formatCompact(analytics.totalSeats),
        helper: `${formatCompact(analytics.availableSeats)} available`,
        icon: Users,
        accent: "from-violet-400/25 to-violet-400/5",
        iconClassName: "bg-violet-400/15 text-violet-200",
      },
      {
        title: "Avg. Rating",
        value: analytics.averageRating.toFixed(1),
        helper: `${formatCompact(analytics.totalReviews)} reviews`,
        icon: Star,
        accent: "from-yellow-400/25 to-yellow-400/5",
        iconClassName: "bg-yellow-400/15 text-yellow-200",
      },
      {
        title: "Avg. Seat Price",
        value: currencyFormatter.format(analytics.averageSeatPrice),
        helper: "Monthly benchmark",
        icon: CircleDollarSign,
        accent: "from-lime-400/25 to-lime-400/5",
        iconClassName: "bg-lime-400/15 text-lime-200",
      },
      {
        title: "Verified",
        value: `${verifiedRate}%`,
        helper: `${analytics.pendingVerification} pending`,
        icon: BadgeCheck,
        accent: "from-sky-400/25 to-sky-400/5",
        iconClassName: "bg-sky-400/15 text-sky-200",
      },
    ],
    [analytics, verifiedRate],
  );

  const roomStats = [
    {
      label: "Meeting Rooms",
      value: analytics.meetingRooms,
      icon: MessageSquareText,
    },
    {
      label: "Conference Rooms",
      value: analytics.conferenceRooms,
      icon: DoorOpen,
    },
    {
      label: "Training Rooms",
      value: analytics.trainingRooms,
      icon: PlusCircle,
    },
  ];

  return (
    <div className="min-h-full w-full bg-background px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <div className="flex flex-col gap-2 pt-3">
          {/* <p className="text-sm font-medium uppercase tracking-[0.08em] text-primary">
            Analytics Overview
          </p> */}
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="group relative min-h-[150px] overflow-hidden rounded-lg border border-border bg-card p-5 shadow-xl shadow-black/10 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/10"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${stat.accent}`}
                />
                <div className="relative flex h-full flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${stat.iconClassName}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold leading-none text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-3 text-sm leading-5 text-muted-foreground">
                      {stat.helper}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-black/10">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-muted-foreground">
                Seat Utilisation
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                {occupancy}% seats booked
              </h2>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${occupancy}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-background/40 p-4">
                <p className="text-sm text-muted-foreground">Total Seats</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {numberFormatter.format(analytics.totalSeats)}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/40 p-4">
                <p className="text-sm text-muted-foreground">Booked Seats</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {numberFormatter.format(analytics.bookedSeats)}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/40 p-4">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {numberFormatter.format(analytics.availableSeats)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-black/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Centre Health
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  Active and verified inventory
                </h2>
              </div>
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Centres</span>
                  <span className="font-medium text-foreground">
                    {activeRate}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${activeRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Verified Centres
                  </span>
                  <span className="font-medium text-foreground">
                    {verifiedRate}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${verifiedRate}%` }}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {analytics.pendingVerification} centres are pending
                verification.
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                Top Cities
              </h2>
              <MapPinned className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-4">
              {analytics.topCities.map((city) => (
                <div key={city.city}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">
                      {city.city}
                    </span>
                    <span className="text-muted-foreground">
                      {city.centres} centres
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${getPercent(city.centres, analytics.totalCentres)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatSqFt(city.sqFt)} sq. ft.
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                Space Mix
              </h2>
              <PieChart className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-4">
              {analytics.spaceTypeMix.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="text-muted-foreground">
                      {item.count}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-cyan-300"
                      style={{
                        width: `${getPercent(item.count, analytics.totalCentres)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-border/70 pt-4">
              <p className="text-sm font-medium text-muted-foreground">
                Categories
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {analytics.categoryMix.map((category) => (
                  <div
                    key={category.label}
                    className="rounded-lg border border-border/70 bg-background/40 p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground">
                      {category.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {category.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                Rooms & Quality
              </h2>
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3">
              {roomStats.map((room) => {
                const Icon = room.icon;

                return (
                  <div
                    key={room.label}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-background/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {room.label}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-foreground">
                      {numberFormatter.format(room.value)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {analytics.gradeMix.map((grade) => (
                <div
                  key={grade.label}
                  className="rounded-lg border border-border/70 bg-background/40 p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground">
                    Grade {grade.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {grade.count}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
