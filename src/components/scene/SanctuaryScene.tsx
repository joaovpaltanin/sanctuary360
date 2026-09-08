"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import { elements, type ElementId } from "../../content/sanctuary";
import { fitCameraPosition, HORIZON, isHotspotVisible, MAX_CAMERA_DISTANCE, modelLayout, OVERVIEW } from "../../lib/model-layout";
import SanctuaryModel from "./SanctuaryModel";
import { SceneErrorBoundary, SceneFallback } from "./SceneErrorBoundary";
import { DesertEnvironment } from "./DesertEnvironment";
import { SceneMotion } from "./SceneMotion";
import { QUALITY_DPR, useReducedMotion, type GraphicQuality } from "../../lib/scene-preferences";

interface SceneProps {
  selectedId: ElementId | null;
  roofVisible: boolean;
  wallsVisible: boolean;
  cameraVersion: number;
  texturesEnabled: boolean;
  animationsEnabled: boolean;
  quality: GraphicQuality;
  horizonView: boolean;
  onSelect: (id: ElementId) => void;
  onUnavailable: () => void;
}

function CameraController({ selectedId, cameraVersion, horizonView }: Pick<SceneProps, "selectedId" | "cameraVersion" | "horizonView">) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, invalidate, size } = useThree();
  const destination = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  const moving = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const frame = selectedId ? modelLayout[selectedId] : null;
    const overview = horizonView ? HORIZON : OVERVIEW;
    const target = frame?.target ?? overview.target;
    const position = frame?.camera ?? overview.position;
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
  }, [selectedId, cameraVersion, horizonView, reducedMotion, camera, invalidate, size.width, size.height]);

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

function RendererMonitor({ onUnavailable }: Pick<SceneProps, "onUnavailable">) {
  const gl = useThree((state) => state.gl);
  useFrame(() => {
    const dpr = gl.getPixelRatio();
    gl.setViewport(0, 0, gl.domElement.width / dpr, gl.domElement.height / dpr);
  }, -2);
  useLayoutEffect(() => {
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
  const reducedMotion = useReducedMotion();
  const animate = props.animationsEnabled && !reducedMotion;
  if (!supported) return <SceneFallback onUnavailable={props.onUnavailable} />;

  return <SceneErrorBoundary onUnavailable={props.onUnavailable}>
    <Canvas
      shadows={props.quality === "low" ? false : "percentage"}
      frameloop="demand"
      dpr={[1, QUALITY_DPR[props.quality]]}
      camera={{ position: OVERVIEW.position, fov: 40, near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      fallback={<SceneFallback onUnavailable={props.onUnavailable} />}
      onCreated={({ gl }) => { gl.domElement.setAttribute("aria-label", "Reconstrução 3D do Tabernáculo. Use a lista de elementos para navegação por teclado."); }}
    >
      <SceneMotion enabled={animate}>
        <DesertEnvironment texturesEnabled={props.texturesEnabled} quality={props.quality} birdsEnabled={!reducedMotion} />
        <SanctuaryModel {...props} />
      </SceneMotion>
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
      <CameraController selectedId={props.selectedId} cameraVersion={props.cameraVersion} horizonView={props.horizonView} />
      <RendererMonitor onUnavailable={props.onUnavailable} />
    </Canvas>
  </SceneErrorBoundary>;
}
