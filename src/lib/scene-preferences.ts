"use client";

import { useSyncExternalStore } from "react";

export type GraphicQuality = "low" | "medium" | "high";
export const QUALITY_DPR: Record<GraphicQuality, number> = { low: 1, medium: 1.25, high: 1.5 };

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
}
