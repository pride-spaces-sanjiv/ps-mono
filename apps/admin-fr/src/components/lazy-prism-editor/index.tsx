import { Suspense, lazy, type ComponentProps } from "react";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
import { cn } from "@/utils/cn";

const LazyEditor = lazy(() => import("@/components/prism-editor"));

export default function LazyPrismEditor({
  loaderProps,
  ...props
}: ComponentProps<typeof LazyEditor> &
  Partial<{ loaderProps: SkeletonProps }>) {
  return (
    <Suspense
      fallback={
        <Skeleton
          count={1}
          {...loaderProps}
          className={cn("w-full h-full", loaderProps?.className)}
          containerClassName={cn("rounded-md h-[50px] w-full", loaderProps?.containerClassName)}
        />
      }
    >
      <LazyEditor {...props} />
    </Suspense>
  );
}
