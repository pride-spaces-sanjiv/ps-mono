import { Suspense, type ReactNode } from "react";
import TopBarProgress from "react-topbar-progress-indicator";
import { getCssVariableValue } from "@/utils/css-variable";
import RotatingLoader from "../loaders/rotating";

interface Props {
  children: ReactNode;
  type: "circle" | "skeleton" | "bar";
}
const SuspensedView = ({ children, type = "bar" }: Partial<Props>) => {
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

  return (
    <Suspense
      fallback={
        type === "bar" ? (
          <TopBarProgress />
        ) : type === "circle" ? (
          <RotatingLoader />
        ) : null
      }
    >
      {children}
    </Suspense>
  );
};

export { SuspensedView };
