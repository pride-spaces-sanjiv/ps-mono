import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "../pages/auth/AuthLayout";
import Login from "../pages/auth/login";

const AuthPage = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route index element={<Navigate to="/login" />} />
      </Route>
    </Routes>
  );
};

export default AuthPage;
