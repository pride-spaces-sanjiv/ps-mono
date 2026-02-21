import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <section className="auth-layout h-full flex justify-center items-center">
      <Outlet />
    </section>
  );
};

export default AuthLayout;
