import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import TopBarProgress from "react-topbar-progress-indicator";
import { toast } from "sonner";
// Hooks
import { useUser } from "@/services/hooks/use-user";
import { useStatesCities } from "@/services/hooks/use-states-cities";
// Utils
import { validateNumber } from "@/utils/number";
import { getCssVariableValue } from "@/utils/css-variable";
// Custom components
import Layout from "@/components/layout/Layout";
import OperatorLayout from "@/components/layout/OperatorLayout";
import RotatingLoader from "@/components/loaders/rotating";
import ActionButton from "@/components/buttons/action-btn";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const SpaceOperators = lazy(() => import("@/pages/operators"));
const SpaceCreatePage = lazy(() => import("@/pages/space/space-create"));
const SpaceEditPage = lazy(() => import("@/pages/space/space-edit-page"));
// Conventional
const Conventional = lazy(() => import("@/pages/conventional"));
const BuilderEditPage = lazy(() => import("@/pages/conventional/builder-edit"));
const LandlordEditPage = lazy(
  () => import("@/pages/conventional/landlord-edit"),
);
// Operator portal
const OperatorHome = lazy(() => import("@/pages/operator-portal/home"));
const OperatorCreate = lazy(() => import("@/pages/operators/operator-create"));
const OperatorEditPage = lazy(
  () => import("@/pages/operators/operator-edit-page"),
);
// Notifications
const NotificationsPage = lazy(() => import("@/pages/notifications"));
// Profile
const Profile = lazy(() => import("@/pages/settings"));
// Amenity
const Amenities = lazy(() => import("@/pages/amenities"));
const CreateAmenity = lazy(() => import("@/pages/amenities/create"));
const EditAmenity = lazy(() => import("@/pages/amenities/edit"));
// Team
const Admins = lazy(() => import("@/pages/admins"));
const AdminCreatePage = lazy(() => import("@/pages/admins/create"));
const AdminEditPage = lazy(() => import("@/pages/admins/edit"));
// Migrations
const MigrationsPage = lazy(() => import("@/pages/migrations"));

interface SuspensedViewProps {
  children: ReactNode;
}

const PrivateRoutes = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    data: res,
    isFetching,
    tokenStoreState,
    userLevel,
    fetchCount,
    tokeInfoFetches,
  } = useUser();
  const {} = useStatesCities();

  const AutoNavigateRender = useCallback(
    ({ El }: { El?: ReactNode }) => El,
    [],
  );

  const isExpired = useMemo(
    () =>
      Date.now() >=
      validateNumber(tokenStoreState.value?.expiry?.getTime(), {
        invalidValue: 0,
      }),
    [tokenStoreState.value],
  );

  useEffect(() => {
    if (!res?.data?.data?.id && !isFetching && userLevel) {
      toast.error("Something wrong ! Please relogin");
    }
  }, [isFetching, res?.data?.data?.id]);
  // const ADMIN_PERMISSIONS = [
  //   "settings",
  //   "dashboard",
  //   "operators",
  //   "conventional",
  //   "amenities",
  //   "team",
  //   "users",
  //   "notifications",
  // ];

  // const sidebarPermissions: Record<string, string[]> = {
  //   "super-admin": ADMIN_PERMISSIONS,
  //   admin: ADMIN_PERMISSIONS,
  //   support: ADMIN_PERMISSIONS,

  //   operator: [
  //     "settings",
  //     "dashboard",
  //     "operators",
  //     "notifications",
  //   ],

  //   builder: [],
  // };

  // const allowedRoutes =
  //   sidebarPermissions[userLevel as keyof typeof sidebarPermissions] ?? [];

  // const hasAccess = allowedRoutes.some((route) =>
  //   location.pathname.startsWith(route)
  // );
  // Show spinner while:
  // 1. tokeInfoFetches is 0 (token info not yet resolved)
  // 2. isFetching (user data query in flight)
  // 3. Token exists and valid but fetchCount is still 0 (right after login, waiting for first user data response)
  const hasToken = !!tokenStoreState.value?.token && !isExpired;
  const stillWaiting =
    !tokeInfoFetches || isFetching || (hasToken && fetchCount === 0);

  if (stillWaiting) {
    return (
      <div className="w-full h-full min-h-dvh flex flex-col gap-3 justify-center items-center px-2 py-4">
        <RotatingLoader className="size-[50px] text-accent-foreground" />

        <p className="text-xl font-medium text-muted-foreground">
          Please Wait.....
        </p>
      </div>
    );
  }

  if (!res?.data?.data?.id) {
    return (
      <div className="text-accent-foreground text-lg font-medium flex flex-col gap-4 items-center justify-center h-full">
        {!tokenStoreState.value?.token
          ? "You need to login with your account before proceeding"
          : isExpired
            ? "Your session has expired. Login again"
            : "We cannot get your data at the moment. Try login again"}

        <ActionButton onClick={() => navigate("/login")}>
          Go to Login
        </ActionButton>
      </div>
    );
  }

  // if (!hasAccess) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  const isOperator = userLevel === "operator";

  if (isOperator) {
    return (
      <Routes>
        <Route element={<OperatorLayout />}>
          <Route
            path="/partner"
            element={
              <SuspensedView>
                <AutoNavigateRender El={<OperatorHome />} />
              </SuspensedView>
            }
          />
          <Route
            path="/partner/:id"
            element={
              <SuspensedView>
                <AutoNavigateRender El={<OperatorEditPage />} />
              </SuspensedView>
            }
          />
          <Route
            path="/spaces/:id"
            element={
              <SuspensedView>
                <AutoNavigateRender El={<SpaceEditPage />} />
              </SuspensedView>
            }
          />
          <Route
            path="/spaces/new"
            element={
              <SuspensedView>
                <AutoNavigateRender El={<SpaceCreatePage />} />
              </SuspensedView>
            }
          />
          <Route
            path="/notifications"
            element={
              <SuspensedView>
                <AutoNavigateRender El={<NotificationsPage />} />
              </SuspensedView>
            }
          />
          <Route path="/*" element={<Navigate to="/partner" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<Dashboard />} />
            </SuspensedView>
          }
        />

        {/* Display */}
        <Route
          path="/spaces"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<SpaceOperators defaultTab="centre" />} />
            </SuspensedView>
          }
        />
        <Route path="/spaces/:id" element={<SpaceEditPage />} />
        <Route path="/spaces/new" element={<SpaceCreatePage />} />

        {/* Conventional */}
        <Route
          path="/conventional"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<Conventional />} />
            </SuspensedView>
          }
        />
        <Route
          path="/conventional/builder/:id"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<BuilderEditPage />} />
            </SuspensedView>
          }
        />
        <Route
          path="/conventional/landlord/:id"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<LandlordEditPage />} />
            </SuspensedView>
          }
        />

        <Route
          path="/operators"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<SpaceOperators />} />
            </SuspensedView>
          }
        />
        <Route path="/operators/:id" element={<OperatorEditPage />} />
        <Route path="/operators/new" element={<OperatorCreate />} />
        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<NotificationsPage />} />
            </SuspensedView>
          }
        />
        {/* Profile */}
        <Route
          path="/settings"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<Profile />} />
            </SuspensedView>
          }
        />
        {/* Amenities */}
        <Route
          path="/amenities"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<Amenities />} />
            </SuspensedView>
          }
        />
        <Route
          path="/amenities/new"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<CreateAmenity />} />
            </SuspensedView>
          }
        />
        <Route
          path="/amenities/:id"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<EditAmenity />} />
            </SuspensedView>
          }
        />
        {/* Team */}
        <Route
          path="/team"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<Admins />} />
            </SuspensedView>
          }
        />
        <Route
          path="/team/new"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<AdminCreatePage />} />
            </SuspensedView>
          }
        />
        <Route
          path="/team/:id"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<AdminEditPage />} />
            </SuspensedView>
          }
        />
        <Route
          path="/migrations"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<MigrationsPage />} />
            </SuspensedView>
          }
        />
        {/* Default redirect */}
        <Route path="/*" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  );
};

const SuspensedView = ({ children }: SuspensedViewProps) => {
  TopBarProgress.config({
    barColors: {
      0: getCssVariableValue("--primary"),
      0.5: getCssVariableValue("--primary-1"),
      0.7: getCssVariableValue("--primary-2"),
      0.9: getCssVariableValue("--primary-3"),
      0.95: getCssVariableValue("--primary-4"),
    },
    barThickness: 1,
    shadowBlur: 5,
  });

  return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>;
};

export default PrivateRoutes;
