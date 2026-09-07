"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import { elements, type ElementId } from "../../content/sanctuary";
import { fitCameraPosition, isHotspotVisible, MAX_CAMERA_DISTANCE, modelLayout, OVERVIEW } from "../../lib/model-layout";
import SanctuaryModel from "./SanctuaryModel";
import { SceneErrorBoundary, SceneFallback } from "./SceneErrorBoundary";

interface SceneProps {
  selectedId: ElementId | null;
  roofVisible: boolean;
  wallsVisible: boolean;
  cameraVersion: number;
  onSelect: (id: ElementId) => void;
  onUnavailable: () => void;
}

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function CameraController({ selectedId, cameraVersion }: Pick<SceneProps, "selectedId" | "cameraVersion">) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, invalidate, size } = useThree();
  const destination = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  const moving = useRef(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);

  useEffect(() => {
    const frame = selectedId ? modelLayout[selectedId] : null;
    const target = frame?.target ?? OVERVIEW.target;
    const position = frame?.camera ?? OVERVIEW.position;
    lookAt.current.set(...target);
    destination.current.set(...fitCameraPosition(position, target, size.width / Math.max(size.height, 1)));
    if (reducedMotion && controls.current) {
      camera.position.copy(destination.current);
      controls.current.target.copy(lookAt.current);
      controls.current.update();
      moving.current = false;
    } else {
      moving.current = true;
    }
    invalidate();
  }, [selectedId, cameraVersion, reducedMotion, camera, invalidate, size.width, size.height]);

  useFrame((_, delta) => {
    if (!moving.current || !controls.current) return;
    const alpha = 1 - Math.exp(-5 * Math.min(delta, 0.1));
    camera.position.lerp(destination.current, alpha);
    controls.current.target.lerp(lookAt.current, alpha);
    if (camera.position.distanceTo(destination.current) < 0.025 && controls.current.target.distanceTo(lookAt.current) < 0.025) {
      camera.position.copy(destination.current);
      controls.current.target.copy(lookAt.current);
      moving.current = false;
    }
    controls.current.update();
    invalidate();
  });

  return <OrbitControls ref={controls} makeDefault enableDamping={!reducedMotion} dampingFactor={0.1} minDistance={5} maxDistance={MAX_CAMERA_DISTANCE} maxPolarAngle={Math.PI / 2.08} minPolarAngle={0.12} onStart={() => { moving.current = false; }} />;
}

function ContextMonitor({ onUnavailable }: Pick<SceneProps, "onUnavailable">) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onUnavailable(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  return null;
}

let webGLConfirmed = false;

function supportsWebGL() {
  if (webGLConfirmed) return true;
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    webGLConfirmed = true;
    return true;
  } catch {
    return false;
  }
}

export default function SanctuaryScene(props: SceneProps) {
  const [supported] = useState(supportsWebGL);
  if (!supported) return <SceneFallback onUnavailable={props.onUnavailable} />;

  return <SceneErrorBoundary onUnavailable={props.onUnavailable}>
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: OVERVIEW.position, fov: 40, near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      fallback={<SceneFallback onUnavailable={props.onUnavailable} />}
      onCreated={({ gl }) => { gl.domElement.setAttribute("aria-label", "Reconstrução 3D do Tabernáculo. Use a lista de elementos para navegação por teclado."); }}
    >
      <color attach="background" args={["#e9e4d9"]} />
      <ambientLight intensity={1.45} />
      <hemisphereLight args={["#fff5df", "#9b8b70", 1.4]} />
      <directionalLight position={[40, 70, 35]} intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70} shadow-camera-far={180} shadow-normalBias={0.15} />
      <directionalLight position={[-30, 20, -30]} intensity={1.2} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#e9e4d9" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, -0.32, 0]}>
        <boxGeometry args={[57, 0.2, 107]} />
        <meshStandardMaterial color="#d2c5ae" roughness={1} />
      </mesh>
      <SanctuaryModel {...props} />
      {elements.map((element) => {
        if (!isHotspotVisible(element.id, props.selectedId, props.roofVisible, props.wallsVisible)) return null;
        return <Html key={element.id} position={modelLayout[element.id].position} center zIndexRange={[15, 0]}>
          <button
            className={`hotspot ${props.selectedId === element.id ? "selected" : ""}`}
            onClick={() => props.onSelect(element.id)}
            aria-label={`Explorar ${element.name}`}
            title={element.name}
            data-hotspot={element.id}
          >
            <span>{element.number}</span><span className="hotspot-label">{element.name}</span>
          </button>
        </Html>;
      })}
      <CameraController selectedId={props.selectedId} cameraVersion={props.cameraVersion} />
      <ContextMonitor onUnavailable={props.onUnavailable} />
    </Canvas>
  </SceneErrorBoundary>;
}
