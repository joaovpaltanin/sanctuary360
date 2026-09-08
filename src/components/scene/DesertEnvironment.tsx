"use client";

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, DoubleSide, DynamicDrawUsage, Object3D, Vector3, type InstancedMesh, type PlaneGeometry, type IcosahedronGeometry } from 'three';
import {
  CLOUD_PERIOD,
  ENVIRONMENT_BUDGETS,
  SUN_POSITION,
  TERRAIN_SIZE,
  cloudDrift,
  createCloudLayout,
  createDesertDecorations,
  sampleBirdFlight,
  terrainHeight,
  type EnvironmentPoint,
  type EnvironmentQuality,
} from '../../lib/environment-layout';
import { getSurfaceTexture } from '../../lib/surface-textures';
import { useSceneTime } from './SceneMotion';

export interface DesertEnvironmentProps {
  texturesEnabled: boolean;
  quality: EnvironmentQuality;
  birdsEnabled: boolean;
}

const ignoreRaycast = () => {};

const skyVertexShader = `
varying vec3 vDirection;
void main() {
  vDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position.z = gl_Position.w;
}
`;

const skyFragmentShader = `
uniform vec3 sunDirection;
uniform vec3 horizonColor;
uniform vec3 zenithColor;
varying vec3 vDirection;
void main() {
  vec3 direction = normalize(vDirection);
  float elevation = smoothstep(0.0, 0.85, max(direction.y, 0.0));
  vec3 skyColor = mix(horizonColor, zenithColor, pow(elevation, 0.55));
  float sunAngle = dot(direction, sunDirection);
  float glow = pow(max(sunAngle, 0.0), 96.0) * 0.24;
  float disc = smoothstep(0.99991, 0.99994, sunAngle);
  skyColor += vec3(1.0, 0.72, 0.36) * glow;
  skyColor = mix(skyColor, vec3(3.5, 3.0, 2.2), disc);
  gl_FragColor = vec4(skyColor, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function shapeTerrain(geometry: PlaneGeometry) {
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    positions.setZ(index, terrainHeight(x, -y));
    uv.setXY(index, x / 168, y / 168);
  }
  positions.needsUpdate = true;
  uv.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

function rootBushGeometry(geometry: IcosahedronGeometry) {
  geometry.translate(0, 1, 0);
}

function DesertGround({ texturesEnabled, quality }: Pick<DesertEnvironmentProps, 'texturesEnabled' | 'quality'>) {
  const texture = texturesEnabled ? getSurfaceTexture('sand') : null;
  const budget = ENVIRONMENT_BUDGETS[quality];
  return <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={quality !== 'low'} raycast={ignoreRaycast}>
    <planeGeometry args={[TERRAIN_SIZE, TERRAIN_SIZE, budget.terrainSegments, budget.terrainSegments]} onUpdate={shapeTerrain} />
    <meshStandardMaterial key={texturesEnabled ? 'textured' : 'plain'} color={texturesEnabled ? '#d4bd91' : '#e0d4bc'} map={texture} bumpMap={texture} bumpScale={texturesEnabled ? 0.07 : 0} roughness={1} />
  </mesh>;
}

function DesertPlantsAndRocks({ quality }: Pick<DesertEnvironmentProps, 'quality'>) {
  const budget = ENVIRONMENT_BUDGETS[quality];
  const rocks = useMemo(() => createDesertDecorations('rock', budget.rocks, budget.terrainSegments), [budget.rocks, budget.terrainSegments]);
  const bushes = useMemo(() => createDesertDecorations('bush', budget.bushes, budget.terrainSegments), [budget.bushes, budget.terrainSegments]);
  const rockMesh = useRef<InstancedMesh>(null);
  const bushMesh = useRef<InstancedMesh>(null);
  const transform = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const time = useSceneTime();

  useLayoutEffect(() => {
    if (!rockMesh.current || !bushMesh.current) return;
    rocks.forEach((rock, index) => {
      transform.position.set(rock.position[0], rock.position[1] + rock.scale[1] * 0.65, rock.position[2]);
      transform.rotation.set(rock.phase * 0.08, rock.rotation, 0.14);
      transform.scale.set(...rock.scale);
      transform.updateMatrix();
      rockMesh.current!.setMatrixAt(index, transform.matrix);
      rockMesh.current!.setColorAt(index, color.setHSL(0.105, 0.16, 0.39 + rock.shade * 0.12));
    });
    bushes.forEach((bush, index) => {
      for (let lobe = 0; lobe < 3; lobe++) {
        const size = lobe === 0 ? 1 : 0.65;
        transform.position.set(bush.position[0] + (lobe === 0 ? 0 : lobe === 1 ? -0.5 : 0.5) * bush.scale[0], bush.position[1] - 0.08, bush.position[2]);
        transform.rotation.set(0, bush.rotation, 0);
        transform.scale.set(bush.scale[0] * size, bush.scale[1] * size, bush.scale[2] * size);
        transform.updateMatrix();
        bushMesh.current!.setMatrixAt(index * 3 + lobe, transform.matrix);
        bushMesh.current!.setColorAt(index * 3 + lobe, color.setHSL(0.19 + bush.shade * 0.04, 0.2, 0.24 + bush.shade * 0.1));
      }
    });
    rockMesh.current.instanceMatrix.needsUpdate = true;
    bushMesh.current.instanceMatrix.setUsage(DynamicDrawUsage);
    bushMesh.current.instanceMatrix.needsUpdate = true;
    if (rockMesh.current.instanceColor) rockMesh.current.instanceColor.needsUpdate = true;
    if (bushMesh.current.instanceColor) bushMesh.current.instanceColor.needsUpdate = true;
  }, [rocks, bushes, transform, color]);

  useFrame(() => {
    if (!bushMesh.current) return;
    const seconds = time.current;
    bushes.forEach((bush, index) => {
      for (let lobe = 0; lobe < 3; lobe++) {
        const size = lobe === 0 ? 1 : 0.65;
        transform.position.set(bush.position[0] + (lobe === 0 ? 0 : lobe === 1 ? -0.5 : 0.5) * bush.scale[0], bush.position[1] - 0.08, bush.position[2]);
        transform.rotation.set(0.025 * Math.sin(seconds * 0.8 + bush.phase), bush.rotation, 0.045 * Math.sin(seconds * 1.15 + bush.phase));
        transform.scale.set(bush.scale[0] * size, bush.scale[1] * size, bush.scale[2] * size);
        transform.updateMatrix();
        bushMesh.current!.setMatrixAt(index * 3 + lobe, transform.matrix);
      }
    });
    bushMesh.current.instanceMatrix.needsUpdate = true;
  });

  return <group>
    <instancedMesh key={`rocks-${quality}`} ref={rockMesh} args={[undefined, undefined, budget.rocks]} raycast={ignoreRaycast} frustumCulled={false}>
      <icosahedronGeometry args={[1, quality === 'high' ? 1 : 0]} />
      <meshStandardMaterial roughness={1} flatShading />
    </instancedMesh>
    <instancedMesh key={`bushes-${quality}`} ref={bushMesh} args={[undefined, undefined, budget.bushes * 3]} raycast={ignoreRaycast} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} onUpdate={rootBushGeometry} />
      <meshStandardMaterial roughness={1} flatShading />
    </instancedMesh>
  </group>;
}

function DesertClouds({ quality }: Pick<DesertEnvironmentProps, 'quality'>) {
  const count = ENVIRONMENT_BUDGETS[quality].clouds;
  const clouds = useMemo(() => createCloudLayout(count), [count]);
  const mesh = useRef<InstancedMesh>(null);
  const time = useSceneTime();

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    clouds.forEach((cloud, index) => {
      for (let lobe = 0; lobe < 3; lobe++) {
        transform.position.set(cloud.position[0] + (lobe - 1) * cloud.scale[0] * 0.85, cloud.position[1] + Math.sin(lobe + cloud.phase) * 2, cloud.position[2]);
        transform.rotation.set(0, cloud.rotation, 0);
        transform.scale.set(cloud.scale[0], cloud.scale[1] * (lobe === 1 ? 1.25 : 0.8), cloud.scale[2]);
        transform.updateMatrix();
        mesh.current!.setMatrixAt(index * 3 + lobe, transform.matrix);
      }
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [clouds]);

  useFrame(() => {
    if (!mesh.current) return;
    mesh.current.position.x = cloudDrift(time.current);
    mesh.current.position.z = Math.sin(time.current * Math.PI * 2 / CLOUD_PERIOD) * 8;
  });

  return <instancedMesh key={quality} ref={mesh} args={[undefined, undefined, count * 3]} raycast={ignoreRaycast} frustumCulled={false}>
    <sphereGeometry args={[1, quality === 'low' ? 8 : 12, 6]} />
    <meshBasicMaterial color="#fff7e8" transparent opacity={0.38} depthWrite={false} />
  </instancedMesh>;
}

function DistantBirds({ quality, birdsEnabled }: Pick<DesertEnvironmentProps, 'quality' | 'birdsEnabled'>) {
  const count = ENVIRONMENT_BUDGETS[quality].birds;
  const enabled = birdsEnabled && count > 0;
  const mesh = useRef<InstancedMesh>(null);
  const transform = useMemo(() => new Object3D(), []);
  const point = useMemo<EnvironmentPoint>(() => [0, 0, 0], []);
  const vertices = useMemo(() => new Float32Array([0, 0, 0, 1.6, 0, -0.3, 0.5, 0, 0.55]), []);
  const time = useSceneTime();

  const updateBirds = (seconds: number) => {
    if (!mesh.current) return;
    for (let index = 0; index < count; index++) {
      sampleBirdFlight(index, seconds, point);
      const heading = -Math.atan2(point[2], point[0]);
      for (let wing = 0; wing < 2; wing++) {
        transform.position.set(...point);
        transform.rotation.set(0, heading + wing * Math.PI, Math.sin(seconds * 3.1 + index * 0.7) * 0.28 + 0.12);
        transform.scale.setScalar(1);
        transform.updateMatrix();
        mesh.current.setMatrixAt(index * 2 + wing, transform.matrix);
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    if (mesh.current) mesh.current.instanceMatrix.setUsage(DynamicDrawUsage);
    updateBirds(time.current);
  });

  useFrame(() => {
    if (enabled) updateBirds(time.current);
  });

  return <group visible={enabled}>
    {count > 0 && <instancedMesh key={quality} ref={mesh} args={[undefined, undefined, count * 2]} raycast={ignoreRaycast} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[vertices, 3]} />
      </bufferGeometry>
      <meshBasicMaterial color="#777465" side={DoubleSide} />
    </instancedMesh>}
  </group>;
}

export function DesertEnvironment({ texturesEnabled, quality, birdsEnabled }: DesertEnvironmentProps) {
  const budget = ENVIRONMENT_BUDGETS[quality];
  const skyUniforms = useMemo(() => ({
    sunDirection: { value: new Vector3(...SUN_POSITION).normalize() },
    horizonColor: { value: new Color('#e1d4b6') },
    zenithColor: { value: new Color('#91bed8') },
  }), []);

  return <>
    <color attach="background" args={['#e1d4b6']} />
    <fog attach="fog" args={['#e1d4b6', 300, 760]} />
    <mesh scale={10000} raycast={ignoreRaycast} frustumCulled={false} renderOrder={-100}>
      <sphereGeometry args={[1, 24, 16]} />
      <shaderMaterial uniforms={skyUniforms} vertexShader={skyVertexShader} fragmentShader={skyFragmentShader} side={BackSide} depthWrite={false} />
    </mesh>
    <ambientLight intensity={0.8} />
    <hemisphereLight args={['#eef5ff', '#aa8756', 1.3]} />
    <directionalLight key={quality} position={SUN_POSITION} color="#fff1d6" intensity={3.1} castShadow={quality !== 'low'} shadow-mapSize={[budget.shadowMapSize || 1024, budget.shadowMapSize || 1024]} shadow-camera-left={-85} shadow-camera-right={85} shadow-camera-top={85} shadow-camera-bottom={-85} shadow-camera-near={1} shadow-camera-far={300} shadow-normalBias={0.12} shadow-bias={-0.0001} />
    <directionalLight position={[30, 25, 45]} color="#e8f3ff" intensity={0.5} />
    <DesertGround texturesEnabled={texturesEnabled} quality={quality} />
    <DesertPlantsAndRocks quality={quality} />
    <DesertClouds quality={quality} />
    <DistantBirds quality={quality} birdsEnabled={birdsEnabled} />
  </>;
}

export default DesertEnvironment;
