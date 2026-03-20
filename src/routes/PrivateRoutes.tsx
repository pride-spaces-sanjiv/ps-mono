import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import TopBarProgress from "react-topbar-progress-indicator";
import { toast } from "sonner";

import { useUser } from "@/services/hooks/use-user";
import { validateNumber } from "@/utils/number";
import { getCssVariableValue } from "@/utils/css-variable";

import Layout from "@/components/layout/Layout";
import RotatingLoader from "@/components/loaders/rotating";
import ActionButton from "@/components/buttons/action-btn";
import SpaceEditPage from "@/pages/space/space-edit-page";
// import OperatorEditPage from "@/pages/operators/operator-edit-page";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Space = lazy(() => import("@/pages/space"));
const SpaceOperators = lazy(() => import("@/pages/operators"));
const SpaceCreatePage = lazy(() => import("@/pages/space/space-create"));
const OperatorCreate = lazy(() => import("@/pages/operators/operator-create"));
const OperatorEditPage = lazy( 
  () => import("@/pages/operators/operator-edit-page"),
);
const Amenities = lazy(() => import("@/pages/amenities")); 

interface SuspensedViewProps {
  children: ReactNode;
}

const PrivateRoutes = () => {
  const navigate = useNavigate();

  const { data: res, isFetching, tokenStoreState } = useUser();

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
    if (!res?.data?.data?.id && !isFetching) {
      toast.error("Something wrong ! Please relogin");
    }
  }, [isFetching, res?.data?.data?.id]);

  if (isFetching) {
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
              <AutoNavigateRender El={<Space />} />
            </SuspensedView>
          }
        />
        <Route path="/spaces/:id" element={<SpaceEditPage />} />
        <Route path="/spaces/new" element={<SpaceCreatePage />} />

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
          
        <Route
          path="/amenities"
          element={
            <SuspensedView>
              <AutoNavigateRender El={<Amenities />} />
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
