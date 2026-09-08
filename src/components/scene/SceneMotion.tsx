"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const SceneTime = createContext<RefObject<number>>({ current: 0 });

export const useSceneTime = () => useContext(SceneTime);

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

export function SceneMotion({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const time = useRef(0);
  const { gl, invalidate } = useThree();
  const [inView, setInView] = useState(false);
  const visible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => false);
  const active = enabled && visible && inView;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(gl.domElement);
    return () => observer.disconnect();
  }, [gl]);

  useEffect(() => {
    invalidate();
    if (!active) return;
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [active, invalidate]);

  useFrame((_, delta) => {
    if (active) time.current += Math.min(delta, 0.05);
  }, -1);

  return <SceneTime.Provider value={time}>{children}</SceneTime.Provider>;
}
