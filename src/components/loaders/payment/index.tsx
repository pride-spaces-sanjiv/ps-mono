import React, { useEffect, useState } from "react";
import processingVideo from "@/assets/images/gifs/money-transfer.gif";
import successGIF from "@/assets/images/gifs/transfer-success.gif";
import failedGIF from "@/assets/images/gifs/transfer-failed.gif";
import { cn } from "@/utils/cn";
import RotatingLoader from "../rotating";

type Props = {
  forceProgress: number;
  maxProgress: number;
  minProgress: number;
  progressRate: number;
  progressDelay: number;
  initialPaused: boolean;
  status: { success: boolean; failed: boolean };
  texts: { progress?: string; success?: string; failure?: string };
  containerProps: React.JSX.IntrinsicElements["div"];
  imgProps: React.JSX.IntrinsicElements["img"];
  pause: boolean;
};
export default function PaymentProcessingLoader({
  forceProgress,
  maxProgress = 90,
  minProgress = 5,
  progressRate = 2,
  progressDelay = 0.5,
  pause = false,
  status = { success: false, failed: false },
  texts = {
    progress: "Verifying Payment",
    success: "Payment Successful",
    failure: "Payment Failed",
  },
  containerProps,
}: Partial<Props>) {
  const [progress, setProgress] = useState(
    Number.isFinite(Number(forceProgress)) ? Number(forceProgress) : minProgress
  );

  useEffect(() => {
    if (status.success || status.failed) {
      setProgress(100);
      return;
    }
    if (!Number.isFinite(Number(forceProgress))) {
      const timer = setInterval(() => {
        setProgress((prev) =>
          Math.min(pause ? prev : prev + progressRate, maxProgress)
        );
      }, progressDelay * 1000);
      return () => clearInterval(timer);
    } else {
      setProgress(Number(forceProgress));
    }
  }, [forceProgress, status.success, status.failed, pause]);

  return (
    <div
      {...containerProps}
      className={cn(
        "flex flex-col gap-3 items-center max-h-[300px] px-2 py-8",
        containerProps?.className
      )}
    >
      <img
        className="aspect-square size-[150px]"
        src={
          progress < 100
            ? processingVideo
            : status.success
            ? successGIF
            : failedGIF
        }
        alt="processing"
      />

      {/* Bar */}
      <div
        className={cn(
          "w-full border border-secondary rounded-full h-[16px] overflow-hidden"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out shadow shadow-lg/70",
            status.success
              ? "bg-green-500 shadow-green-500/50"
              : status.failed
              ? "bg-red-500 shadow-red-500/50"
              : progress < 15
              ? "bg-yellow-500 shadow-yellow-500/50"
              : progress < 35
              ? "bg-orange-400 shadow-orange-400/50"
              : "bg-blue-500 shadow-blue-500/50"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={cn("flex gap-3 items-center")}>
        {progress < 100
          ? texts.progress
          : status.success
          ? texts.success
          : texts.failure}
        {progress < 100 && <RotatingLoader className={cn("size-4")} />}
      </div>
    </div>
  );
}
