import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <section className="auth-layout w-full h-full min-h-screen">
      <Outlet />
    </section>
  );
};

export default AuthLayout;
