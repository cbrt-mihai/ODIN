"use client";

import { DevPerformanceMeasurePatch } from "@/components/dev/performance-measure-patch";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <ToastProvider>
        <DevPerformanceMeasurePatch />
        {children}
      </ToastProvider>
    </ConfirmProvider>
  );
}
