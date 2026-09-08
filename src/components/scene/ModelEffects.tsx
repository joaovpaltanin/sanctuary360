'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Mesh, ShaderMaterial } from 'three';
import type { Point3 } from '../../lib/model-layout';
import { useSceneTime } from './SceneMotion';

const ignoreRaycast = () => {};
const vertexShader = `
  uniform float time;
  uniform float seed;
  uniform float kind;
  varying vec2 effectUv;
  varying float life;
  void main() {
    effectUv = uv;
    life = fract(time * 0.12 + seed);
    vec3 p = position;
    if (kind < 0.5) {
      p.x += sin(time * 3.6 + seed * 19.0 + uv.y * 4.0) * 0.07 * uv.y * uv.y;
      p.y = (p.y + 0.5) * (0.92 + 0.08 * sin(time * 5.0 + seed * 31.0)) - 0.5;
    } else if (kind < 1.5) {
      p.xy *= 0.4 + life * 0.9;
      p.x += sin(life * 5.0 + seed * 13.0) * life * 0.28;
      p.y += life * 2.0;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragmentShader = `
  uniform float time;
  uniform float seed;
  uniform float kind;
  varying vec2 effectUv;
  varying float life;
  void main() {
    vec2 uv = effectUv;
    vec3 color;
    float alpha;
    if (kind < 0.5) {
      float width = max(0.025, 0.36 * pow(1.0 - uv.y, 0.8));
      float edge = abs(uv.x - 0.5) / width;
      alpha = (1.0 - smoothstep(0.45, 1.0, edge)) * smoothstep(0.0, 0.13, uv.y) * (1.0 - smoothstep(0.8, 1.0, uv.y));
      float core = (1.0 - smoothstep(0.0, 0.65, edge)) * (1.0 - uv.y);
      color = mix(vec3(1.0, 0.17, 0.015), vec3(1.0, 0.79, 0.22), core);
      alpha *= 0.8;
    } else if (kind < 1.5) {
      float radius = length((uv - 0.5) * 2.0);
      float wisps = 0.7 + 0.3 * sin(uv.x * 17.0 + uv.y * 13.0 + seed * 20.0);
      alpha = (1.0 - smoothstep(0.12, 1.0, radius)) * sin(life * 3.14159265) * wisps * 0.12;
      color = vec3(0.55, 0.52, 0.46);
    } else {
      float radius = length((uv - 0.5) * 2.0);
      float wave = sin(radius * 38.0 - time * 1.7 + 0.6 * sin(uv.x * 9.0 + time * 0.4));
      alpha = pow(max(0.0, wave), 8.0) * (1.0 - smoothstep(0.75, 0.99, radius)) * 0.13;
      color = vec3(0.66, 0.79, 0.79);
    }
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function EffectPatch({ position, scale, kind, seed = 0 }: {
  position: Point3;
  scale: Point3;
  kind: 0 | 1 | 2;
  seed?: number;
}) {
  const time = useSceneTime();
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    seed: { value: seed },
    kind: { value: kind },
  }), [kind, seed]);

  useFrame(({ camera }) => {
    if (material.current) material.current.uniforms.time.value = time.current;
    if (mesh.current && kind !== 2) {
      const elements = camera.matrixWorld.elements;
      const x = elements[8];
      const z = elements[10];
      if (x * x + z * z > 0.000001) mesh.current.rotation.set(0, Math.atan2(x, z), 0);
    }
  });

  return (
    <mesh
      ref={mesh}
      position={position}
      scale={scale}
      rotation={kind === 2 ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
      raycast={ignoreRaycast}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1, 4, 8]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

const altarFlames: Point3[] = [
  [-0.8, 2.5, 24.5],
  [0, 2.6, 24.4],
  [0.8, 2.5, 24.7],
  [-0.5, 2.55, 25.3],
  [0.4, 2.6, 25.4],
];

export default function ModelEffects() {
  return (
    <group name="model-ambient-effects">
      <group name="altar-fire">
        {altarFlames.map((position, index) => (
          <EffectPatch key={index} position={position} scale={[0.9, 1.9, 1]} kind={0} seed={index * 0.17} />
        ))}
      </group>
      <group name="incense-smoke">
        {Array.from({ length: 6 }, (_, index) => (
          <EffectPatch key={index} position={[0, 2.1, -23]} scale={[0.38, 0.75, 1]} kind={1} seed={index / 6} />
        ))}
      </group>
      <group name="seven-oil-lamp-flames">
        {[-3, -2, -1, 0, 1, 2, 3].map((index) => (
          <EffectPatch key={index} position={[-2.92, 3.64, -16 - index * 0.53]} scale={[0.13, 0.27, 1]} kind={0} seed={(index + 3) / 7} />
        ))}
      </group>
      <EffectPatch position={[0, 2.216, 8]} scale={[3.15, 3.15, 1]} kind={2} />
    </group>
  );
}
