"use client";

import { patchPerformanceMeasureInDev } from "@/lib/dev/performance-measure-patch";

patchPerformanceMeasureInDev();

/** Dev-only: silences React/Turbopack negative performance.measure timestamps. */
export function DevPerformanceMeasurePatch() {
  return null;
}
