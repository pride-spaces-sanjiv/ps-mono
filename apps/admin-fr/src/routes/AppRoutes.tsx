import { Suspense, useEffect, useMemo, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useSearchParams,
  Outlet,
} from "react-router-dom";
// import { TawkLiveChat } from "tawk-react";
import { Toaster } from "@/components/ui/sonner";
import { tokenStore, userStore } from "@/services/store/user";
// import { useTawk } from "@/services/hooks/use-tawk";
import { refreshTokenAPI } from "@/services/apis/auth";
import { reConfigureAuthToken } from "@/utils/axios/configure";
import { validateNumber } from "@/utils/number";
import AuthRoutes from "@/routes/AuthRoutes";
import PrivateRoutes from "./PrivateRoutes";
import AuthLayout from "@/pages/auth/AuthLayout";
import LoginPage from "@/pages/auth/login";
import ResetPasswordPage from "@/pages/auth/reset-password";
import TermsAndConditions from "@/pages/legal/terms";
import PrivacyPolicy from "@/pages/legal/privacy";

// Lazy components
const LandingPage = lazy(() => import("@/pages/home"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex h-screen justify-center items-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

const ThemeManager = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const userLevel = userStore((state) => state.level);
  const tokenData = tokenStore((state) => state.value);

  const expired = useMemo(
    () =>
      validateNumber(tokenData?.expiry?.getTime(), { invalidValue: 0 }) <=
      Date.now(),
    [tokenData],
  );

  useEffect(() => {
    let activeTheme = "theme-admin";
    const isLoggedIn = !!tokenData?.token && !expired;

    if (isLoggedIn && userLevel) {
      if (userLevel === "operator") {
        activeTheme = "theme-operator";
      } else if (userLevel === "builder") {
        activeTheme = "theme-builder";
      } else if (userLevel === "channel") {
        activeTheme = "theme-channel";
      } else {
        activeTheme = "theme-admin";
      }
    } else {
      const loginAs = searchParams.get("as")?.toLowerCase().trim();
      if (loginAs === "operator") {
        activeTheme = "theme-operator";
      } else if (loginAs === "builder") {
        activeTheme = "theme-builder";
      } else if (loginAs === "channel") {
        activeTheme = "theme-channel";
      } else {
        activeTheme = "theme-admin";
      }
    }

    const root = document.documentElement;
    root.classList.remove("theme-admin", "theme-operator", "theme-builder", "theme-channel");
    root.classList.add(activeTheme);
  }, [searchParams, location.pathname, userLevel, tokenData, expired]);

  return null;
};

const PostLoginRedirect = () => {
  const userLevel = userStore((state) => state.level);
  return (
    <Navigate
      to={userLevel === "operator" ? "/partner" : "/dashboard"}
      replace
    />
  );
};

const AppRoutes = () => {
  // useTawk();

  // const navigate = useNavigate();
  const [tokenData, setTokenData] = [
    tokenStore((state) => state.value),
    tokenStore((state) => state.setter),
  ];

  const expired = useMemo(
    () =>
      validateNumber(tokenData?.expiry?.getTime(), { invalidValue: 0 }) <=
      Date.now(),
    [tokenData],
  );

  const refresh = async () => {
    try {
      if (!tokenData?.refreshToken) {
        throw new Error("Refresh token not present");
      }
      throw new Error("Error due to incomplete code");
      // const res = await refreshTokenAPI({
      //   body: { refreshToken: tokenData?.refreshToken },
      // });
      // const data = res.data?.data;
      // if (
      //   res.status === 200 &&
      //   res.data.success &&
      //   data?.token &&
      //   data?.expiry
      // ) {
      //   const expiry = new Date(data.expiry);
      //   if (expiry.getTime() <= Date.now()) {
      //     throw new Error("Token expired");
      //   }

      //   reConfigureAuthToken(data.token, expiry);
      //   setTokenData({
      //     ...tokenData,
      //     token: data.token,
      //     expiry: expiry,
      //   });
      // }
    } catch (err) {
      console.error("Error refreshing :", err);
    }
  };

  // Token validation
  useEffect(() => {
    const rem = Math.max(0, (tokenData?.expiry?.getTime() || 0) - Date.now());
    const timer = setTimeout(refresh, rem);
    return () => {
      timer && clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    console.log("Token status :", { expired, tokenData });
  }, [expired]);

  return (
    <Router>
      <ThemeManager />
      <Suspense fallback={<LoadingSpinner />}>
        {/* // <TawkLiveChat 
          // propertyId="695d4b1cb3e90b197cc30e76"
          // widgetId="1jea6qq7o"
          // visitor={
          //   userData?.email && userData.name
          //     ? { email: userData?.email, name: userData?.name }
          //     : undefined
          // }
        // /> */}
        <Routes>
          <Route
            element={
              <div className="h-dvh">
                <Outlet />
                <Toaster richColors />
              </div>
            }
          >
            <Route path="/" element={<LandingPage />} />
            <Route element={expired && <Navigate to={"/login"} />} />
            <Route
              element={
                !!tokenData?.token && !expired && <PostLoginRedirect />
              }
            />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              {/* <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/home" element={<LandingPage />} />
            </Route>
            <Route path="/*" element={<PrivateRoutes />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;
