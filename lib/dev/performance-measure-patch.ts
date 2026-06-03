/**
 * Dev-only workaround for React/Next.js Turbopack calling performance.measure
 * with a negative timestamp when a server component render is aborted (HMR, Suspense).
 * @see https://github.com/vercel/next.js/issues/86060
 */
export function patchPerformanceMeasureInDev() {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof performance === "undefined" || typeof performance.measure !== "function") {
    return;
  }

  const original = performance.measure.bind(performance);

  performance.measure = function patchedMeasure(
    name: string,
    startOrMeasureOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ): PerformanceMeasure {
    try {
      if (typeof startOrMeasureOptions === "object" && startOrMeasureOptions !== null) {
        return original(name, startOrMeasureOptions);
      }
      if (endMark !== undefined) {
        return original(name, startOrMeasureOptions as string, endMark);
      }
      if (typeof startOrMeasureOptions === "string") {
        return original(name, startOrMeasureOptions);
      }
      return original(name);
    } catch (err) {
      if (
        err instanceof TypeError &&
        err.message.includes("cannot have a negative time stamp")
      ) {
        return {
          name,
          entryType: "measure",
          startTime: 0,
          duration: 0,
        } as PerformanceMeasure;
      }
      throw err;
    }
  };
}
