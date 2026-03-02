import { Suspense, useEffect, useMemo, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Outlet,
} from "react-router-dom";
// import { TawkLiveChat } from "tawk-react";
import { Toaster } from "@/components/ui/sonner";
import { tokenStore } from "@/services/store/user";
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
    [tokenData]
  );

  const refresh = async () => {
    try {
      if (!tokenData?.refreshToken) {
        throw new Error("Refresh token not present");
      }
      const res = await refreshTokenAPI({
        body: { refreshToken: tokenData?.refreshToken },
      });
      const data = res.data?.data;
      if (
        res.status === 200 &&
        res.data.success &&
        data?.token &&
        data?.expiry
      ) {
        const expiry = new Date(data.expiry);
        if (expiry.getTime() <= Date.now()) {
          throw new Error("Token expired");
        }

        reConfigureAuthToken(data.token, expiry);
        setTokenData({
          ...tokenData,
          token: data.token,
          expiry: expiry,
        });
      }
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
    console.log("Token status :", expired, tokenData);
  }, [expired]);

  return (
    <Router>
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
                !!tokenData?.token && !expired && <Navigate to={"/dashboard"} />
              }
            />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
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
