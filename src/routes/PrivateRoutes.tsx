import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  type ComponentType,
  type JSX,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import TopBarProgress from "react-topbar-progress-indicator";
import { toast } from "sonner";
import { useUser } from "@/services/hooks/use-user";
// import { useTawk } from "@/services/hooks/use-tawk";
import { validateNumber } from "@/utils/number";
// import { datifyObjectValues } from "@/utils/object/datify";
import { getCssVariableValue } from "@/utils/css-variable";
import Layout from "@/components/layout/Layout";
import RotatingLoader from "@/components/loaders/rotating";
import ActionButton from "@/components/buttons/action-btn";

// Lazy load components
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Users = lazy(() => import("@/pages/users"));
const Display = lazy(() => import("@/pages/display"));
const Settings = lazy(() => import("@/pages/settings"));

interface SuspensedViewProps {
  children: ReactNode;
}

const PrivateRoutes = () => {
  // useTawk();

  const navigate = useNavigate();

  const {
    data: res,
    isFetching,
    tokenStoreState,
    userLevel,
    status,
    fetchCount,
  } = useUser();

  const AutoNavigateRender = useCallback(
    ({
      El,
    }: Partial<{
      El: ReactNode;
    }>) =>
      fetchCount > 0 && status === "success" && userLevel < 1 ? (
        <Navigate to={"/settings"} />
      ) : (
        El
      ),
    [fetchCount, status, userLevel],
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

  return !!isFetching ? (
    <div className="w-full h-full min-h-dvh flex flex-col gap-3 justify-center items-center px-2 py-4">
      <RotatingLoader className="size-[50px] text-accent-foreground"></RotatingLoader>
      <p className="text-xl font-medium text-muted-foreground">
        Please Wait.....
      </p>
    </div>
  ) : !res?.data?.data?.id ? (
    <div className="text-accent-foreground text-lg font-medium flex flex-col gap-4 items-center justify-center h-full">
      {!tokenStoreState.value?.token
        ? "You need to login with your account before proceeding"
        : isExpired
          ? "Your session has expired. Login again"
          : "We cannot get your data at the moment. Try login again"}
      <ActionButton
        className=""
        onClick={() => {
          navigate("/login");
        }}
      >
        Go to Login
      </ActionButton>
    </div>
  ) : (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={
              <SuspensedView>
                {/* {fetchCount > 0 && status === "success" && userLevel < 1 ? (
                  <Navigate to={"/settings"} />
                ) : (
                  <Dashboard />
                )} */}
                <AutoNavigateRender El={<Dashboard />} />
              </SuspensedView>
            }
          />
          <Route
            path="/display"
            element={
              <SuspensedView>

                <AutoNavigateRender El={<Display />} />
              </SuspensedView>
            }
          />

          <Route path="/users/">
            <Route
              index
              element={
                <SuspensedView>
                  {/* <Users /> */}
                  <AutoNavigateRender El={<Users />} />
                </SuspensedView>
              }
            />
            <Route
              path="/users/:id"
              element={
                <SuspensedView>
                  {/* <Users /> */}
                  <AutoNavigateRender El={<Users />} />
                </SuspensedView>
              }
            />
          </Route>

          <Route
            path="/settings/*"
            element={
              <SuspensedView>
                <Settings />
              </SuspensedView>
            }
          />

          <Route path="/*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </>
  );
};

const SuspensedView = ({ children }: SuspensedViewProps) => {
  const baseColor = "var(--ring)";

  // console.log(getCssVariableValue("--primary"));

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
