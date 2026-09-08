'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Group,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import type { ElementId } from '../../content/sanctuary';
import type { Point3 } from '../../lib/model-layout';
import { getSurfaceTexture, type SurfaceTextureKind } from '../../lib/surface-textures';
import ModelEffects from './ModelEffects';
import { useSceneTime } from './SceneMotion';

export type SanctuaryModelProps = {
  selectedId: ElementId | null;
  roofVisible: boolean;
  wallsVisible: boolean;
  texturesEnabled: boolean;
  onSelect: (id: ElementId) => void;
};

const box = new BoxGeometry(1, 1, 1);
const cylinder = new CylinderGeometry(1, 1, 1, 12);
const sphere = new SphereGeometry(1, 12, 8);
const ring = new TorusGeometry(1, 0.09, 6, 20);
const horn = new CylinderGeometry(0.025, 0.16, 0.55, 6);
const bowl = new SphereGeometry(1, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
const cloth = new BoxGeometry(1, 1, 0.055, 48, 1, 1);
const clothPositions = cloth.attributes.position;
for (let i = 0; i < clothPositions.count; i += 1) {
  clothPositions.setZ(
    i,
    clothPositions.getZ(i) + Math.sin(clothPositions.getX(i) * Math.PI * 24) * 0.075,
  );
}
cloth.computeVertexNormals();

const colors = {
  linen: '#e9ddbd',
  gold: '#c79a42',
  brightGold: '#e7be67',
  bronze: '#9c623b',
  darkBronze: '#60402d',
  silver: '#b5b8ad',
  wood: '#5f4031',
  blue: '#365c7e',
  purple: '#665075',
  scarlet: '#9c4147',
  leather: '#775440',
  bread: '#dba96c',
  water: '#537f88',
  floor: '#bba382',
} as const;

type Finish = keyof typeof colors;
const TextureMode = createContext(false);
const surfaces: Partial<Record<Finish, SurfaceTextureKind>> = {
  linen: 'linen',
  blue: 'linen',
  purple: 'linen',
  scarlet: 'linen',
  gold: 'metal',
  brightGold: 'metal',
  bronze: 'metal',
  darkBronze: 'metal',
  silver: 'metal',
  wood: 'wood',
  leather: 'leather',
  floor: 'sand',
};
const materials = Object.fromEntries(
  Object.entries(colors).map(([name, color]) => {
    const metallic = ['gold', 'brightGold', 'bronze', 'darkBronze', 'silver'].includes(name);
    const base = new MeshStandardMaterial({
      color,
      roughness: metallic ? 0.34 : name === 'water' ? 0.2 : 0.86,
      metalness: metallic ? 0.72 : name === 'water' ? 0.3 : 0,
      side: DoubleSide,
    });
    const selected = base.clone();
    selected.emissive.set('#e5ac52');
    selected.emissiveIntensity = 0.22;
    const surface = surfaces[name as Finish];
    const textured = base.clone();
    textured.map = surface ? getSurfaceTexture(surface) : null;
    const texturedSelected = selected.clone();
    texturedSelected.map = textured.map;
    return [name, { base, selected, textured, texturedSelected }];
  }),
) as Record<Finish, {
  base: MeshStandardMaterial;
  selected: MeshStandardMaterial;
  textured: MeshStandardMaterial;
  texturedSelected: MeshStandardMaterial;
}>;

const arms = [-1, 1].flatMap((side) =>
  [1, 2, 3].map((level) => {
    const reach = side * level * 0.53;
    const start = 2.45 - level * 0.43;
    return new TubeGeometry(
      new CatmullRomCurve3([
        new Vector3(0, start, 0),
        new Vector3(reach * 0.65, start + 0.26, 0),
        new Vector3(reach, 2.7, 0),
        new Vector3(reach, 3.25, 0),
      ]),
      16,
      0.065,
      6,
      false,
    );
  }),
);

function WindCloth({ position, scale, rotation, material, shadow }: {
  position: Point3;
  scale: Point3;
  rotation: Point3;
  material: MeshStandardMaterial;
  shadow: boolean;
}) {
  const pivot = useRef<Group>(null);
  const time = useSceneTime();
  const phase = position[0] * 0.23 + position[2] * 0.11 + scale[0] * 0.07;

  useFrame(() => {
    if (!pivot.current) return;
    const elapsed = time.current;
    pivot.current.rotation.x = 0.012 * Math.sin(elapsed * 0.7) * (0.8 + 0.2 * Math.sin(elapsed * 0.23 + phase));
  });

  return (
    <group name="wind-cloth" position={position} rotation={rotation}>
      <group ref={pivot} position={[0, scale[1] / 2, 0]}>
        <mesh
          geometry={cloth}
          material={material}
          position={[0, -scale[1] / 2, 0]}
          scale={scale}
          castShadow={shadow}
          receiveShadow
        />
      </group>
    </group>
  );
}

function Part({
  geometry = box,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  finish = 'gold',
  selected = false,
  shadow = true,
}: {
  geometry?: BufferGeometry;
  position?: Point3;
  scale?: Point3;
  rotation?: Point3;
  finish?: Finish;
  selected?: boolean;
  shadow?: boolean;
}) {
  const textured = useContext(TextureMode);
  const variant = textured ? (selected ? 'texturedSelected' : 'textured') : (selected ? 'selected' : 'base');
  if (geometry === cloth) {
    return <WindCloth position={position} scale={scale} rotation={rotation} material={materials[finish][variant]} shadow={shadow} />;
  }
  return (
    <mesh
      geometry={geometry}
      material={materials[finish][variant]}
      position={position}
      scale={scale}
      rotation={rotation}
      castShadow={shadow}
      receiveShadow
    />
  );
}

function Selectable({
  id,
  position,
  onSelect,
  children,
}: {
  id: ElementId;
  position: Point3;
  onSelect: SanctuaryModelProps['onSelect'];
  children: ReactNode;
}) {
  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (event.delta <= 4) onSelect(id);
  }

  return (
    <group name={id} position={position} onClick={select}>
      {children}
    </group>
  );
}

function Pole({ position, height = 5, tent = false }: { position: Point3; height?: number; tent?: boolean }) {
  return (
    <group position={position}>
      <Part geometry={cylinder} position={[0, height / 2, 0]} scale={[tent ? 0.1 : 0.13, height, tent ? 0.1 : 0.13]} finish={tent ? 'gold' : 'wood'} />
      <Part position={[0, 0.13, 0]} scale={[0.65, 0.26, 0.65]} finish={tent ? 'silver' : 'bronze'} />
      <Part geometry={sphere} position={[0, height, 0]} scale={[0.22, 0.17, 0.22]} finish={tent ? 'gold' : 'silver'} />
    </group>
  );
}

function Textile({ width, height, selected = false, opening = 0 }: { width: number; height: number; selected?: boolean; opening?: number }) {
  const stripWidth = (width - opening) / 12;
  const finishes: Finish[] = ['blue', 'purple', 'scarlet'];
  return (
    <group>
      {Array.from({ length: 12 }, (_, index) => {
        const x = -width / 2 + stripWidth * (index + 0.5) + (index >= 6 ? opening : 0);
        return (
          <Part key={index} geometry={cloth} position={[x, height / 2, 0]} scale={[stripWidth, height, 1]} finish={finishes[index % 3]} selected={selected} />
        );
      })}
      <Part position={[0, height - 0.2, 0.08]} scale={[width, 0.3, 0.15]} finish="blue" selected={selected} />
      {[-1, 1].map((side) => (
        <Part key={side} position={[side * (width + opening) / 4, 0.3, 0.12]} scale={[(width - opening) / 2, 0.12, 0.08]} finish="brightGold" selected={selected} />
      ))}
    </group>
  );
}

function Courtyard({ selectedId, onSelect }: Pick<SanctuaryModelProps, 'selectedId' | 'onSelect'>) {
  return (
    <group name="courtyard">
      {[-25, 25].map((x) => (
        <group key={x}>
          <Part geometry={cloth} position={[x, 2.5, 0]} scale={[100, 5, 1]} rotation={[0, Math.PI / 2, 0]} finish="linen" />
          {Array.from({ length: 21 }, (_, index) => <Pole key={index} position={[x, 0, -50 + index * 5]} />)}
          <Part position={[x, 4.9, 0]} scale={[0.12, 0.12, 100]} finish="silver" />
        </group>
      ))}
      <Part geometry={cloth} position={[0, 2.5, -50]} scale={[50, 5, 1]} finish="linen" />
      <Part position={[0, 4.9, -50]} scale={[50, 0.12, 0.12]} finish="silver" />
      {Array.from({ length: 9 }, (_, index) => <Pole key={index} position={[-20 + index * 5, 0, -50]} />)}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Part geometry={cloth} position={[side * 17.5, 2.5, 50]} scale={[15, 5, 1]} finish="linen" />
          <Part position={[side * 17.5, 4.9, 50]} scale={[15, 0.12, 0.12]} finish="silver" />
          {[15, 20].map((x) => <Pole key={x} position={[side * x, 0, 50]} />)}
        </group>
      ))}
      <Selectable id="gate" position={[0, 0, 50]} onSelect={onSelect}>
        <Textile width={20} height={5} opening={4} selected={selectedId === 'gate'} />
        {[-10, -10 / 3, 10 / 3, 10].map((x) => <Pole key={x} position={[x, 0, 0]} />)}
      </Selectable>
    </group>
  );
}

function Tent({ wallsVisible, roofVisible, selectedId, onSelect }: SanctuaryModelProps) {
  return (
    <group name="tent">
      <Part position={[0, -0.13, -20]} scale={[10.6, 0.26, 30.6]} finish="floor" />
      <Part position={[0, 0.012, -30]} scale={[9.7, 0.025, 9.7]} finish="linen" shadow={false} />
      {[-5, 5].map((x) => (
        <group key={x}>
          <Part position={[x, 0.2, -20]} scale={[0.28, 0.4, 30]} finish="silver" />
          {[-35, -25, -15, -5].map((z) => <Pole key={z} position={[x, 0, z]} height={10} tent />)}
        </group>
      ))}
      <Part position={[0, 0.2, -35]} scale={[10, 0.4, 0.28]} finish="silver" />
      {wallsVisible && (
        <group name="tent-walls">
          {[-1, 1].map((side) => (
            <group key={side}>
              <Part position={[side * 5, 5, -20]} scale={[0.2, 10, 30]} finish="gold" />
              <Part geometry={cloth} position={[side * 5.15, 5.05, -20]} scale={[30, 9.8, 1]} rotation={[0, Math.PI / 2, 0]} finish="linen" />
              {Array.from({ length: 20 }, (_, index) => (
                <Part key={index} position={[side * 4.86, 5, -34.25 + index * 1.5]} scale={[0.1, 10, 0.055]} finish="brightGold" />
              ))}
              {[2, 5, 8].map((y) => <Part key={y} position={[side * 5.27, y, -20]} scale={[0.12, 0.12, 30]} finish="wood" />)}
            </group>
          ))}
          <Part position={[0, 5, -35]} scale={[10, 10, 0.22]} finish="gold" />
          <Part geometry={cloth} position={[0, 5, -35.16]} scale={[10, 10, 1]} finish="linen" />
          <group position={[0, 0, -5]}>
            <Textile width={10} height={10} opening={2} />
            {[-4.8, -2.4, 0, 2.4, 4.8].map((x) => <Pole key={x} position={[x, 0, 0]} height={10} tent />)}
          </group>
          <Selectable id="veil" position={[0, 0, -25]} onSelect={onSelect}>
            <Textile width={10} height={10} selected={selectedId === 'veil'} />
            {[-4.8, -1.6, 1.6, 4.8].map((x) => <Pole key={x} position={[x, 0, -0.18]} height={10} tent />)}
            {[-3.2, 0, 3.2].map((x) => (
              <Part key={x} position={[x, 5.7, 0.19]} scale={[0.45, 0.45, 0.06]} rotation={[0, 0, Math.PI / 4]} finish="brightGold" selected={selectedId === 'veil'} />
            ))}
          </Selectable>
        </group>
      )}
      {roofVisible && (
        <group name="tent-roof">
          <Part position={[0, 10.06, -20]} scale={[10.8, 0.14, 31]} finish="linen" />
          <Part position={[0, 10.25, -20]} scale={[11.3, 0.22, 31.5]} finish="leather" />
          {[-1, 1].map((side) => <Part key={side} position={[side * 5.55, 9.7, -20]} scale={[0.18, 1.05, 31.5]} finish="leather" />)}
          {[-30, -20, -10].map((z) => <Part key={z} position={[0, 10.38, z]} scale={[11.3, 0.055, 0.12]} finish="wood" />)}
        </group>
      )}
    </group>
  );
}

function CarryingPoles({ width, length, y, finish, selected }: { width: number; length: number; y: number; finish: Finish; selected: boolean }) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Part geometry={cylinder} position={[side * width, y, 0]} scale={[0.07, length, 0.07]} rotation={[Math.PI / 2, 0, 0]} finish={finish} selected={selected} />
          {[-1, 1].map((end) => <Part key={end} geometry={ring} position={[side * width, y, end * length * 0.23]} scale={[0.14, 0.14, 0.14]} finish={finish} selected={selected} />)}
        </group>
      ))}
    </group>
  );
}

function Horns({ x, z, y, finish, selected }: { x: number; z: number; y: number; finish: Finish; selected: boolean }) {
  return (
    <group>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Part key={`${sx}:${sz}`} geometry={horn} position={[sx * x, y + 0.18, sz * z]} rotation={[sz * 0.2, 0, -sx * 0.2]} finish={finish} selected={selected} />
      )))}
    </group>
  );
}

function Altar({ selected }: { selected: boolean }) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Part position={[side * 2.35, 1.5, 0]} scale={[0.3, 3, 5]} finish="bronze" selected={selected} />
          <Part position={[0, 1.5, side * 2.35]} scale={[4.4, 3, 0.3]} finish="bronze" selected={selected} />
          <Part position={[side * 2.36, 2.93, 0]} scale={[0.28, 0.14, 5]} finish="darkBronze" selected={selected} />
          <Part position={[0, 2.93, side * 2.36]} scale={[5, 0.14, 0.28]} finish="darkBronze" selected={selected} />
        </group>
      ))}
      {Array.from({ length: 11 }, (_, index) => (
        <group key={index}>
          <Part position={[-2 + index * 0.4, 1.5, 0]} scale={[0.065, 0.09, 4.4]} finish="darkBronze" selected={selected} />
          <Part position={[0, 1.5, -2 + index * 0.4]} scale={[4.4, 0.09, 0.065]} finish="darkBronze" selected={selected} />
        </group>
      ))}
      <Horns x={2.27} z={2.27} y={3} finish="bronze" selected={selected} />
      <CarryingPoles width={2.7} length={7.5} y={1.35} finish="bronze" selected={selected} />
    </group>
  );
}

function Basin({ selected }: { selected: boolean }) {
  return (
    <group>
      <Part geometry={cylinder} position={[0, 0.15, 0]} scale={[1.15, 0.3, 1.15]} finish="darkBronze" selected={selected} />
      <Part geometry={cylinder} position={[0, 0.7, 0]} scale={[0.42, 1.1, 0.42]} finish="bronze" selected={selected} />
      <Part geometry={bowl} position={[0, 2.4, 0]} scale={[1.7, 1.25, 1.7]} finish="bronze" selected={selected} />
      <Part geometry={ring} position={[0, 2.4, 0]} scale={[1.7, 1.7, 1.2]} rotation={[Math.PI / 2, 0, 0]} finish="bronze" selected={selected} />
      <Part geometry={cylinder} position={[0, 2.2, 0]} scale={[1.65, 0.025, 1.65]} finish="water" selected={selected} shadow={false} />
    </group>
  );
}

function Table({ selected }: { selected: boolean }) {
  return (
    <group>
      <Part position={[0, 1.4, 0]} scale={[2, 0.2, 1]} selected={selected} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Part key={`${sx}:${sz}`} position={[sx * 0.83, 0.65, sz * 0.33]} scale={[0.14, 1.3, 0.14]} selected={selected} />))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Part position={[0, 1.16, side * 0.43]} scale={[2, 0.17, 0.1]} finish="brightGold" selected={selected} />
          <Part position={[side * 0.93, 1.16, 0]} scale={[0.1, 0.17, 1]} finish="brightGold" selected={selected} />
          {Array.from({ length: 6 }, (_, index) => <Part key={index} geometry={sphere} position={[side * 0.49, 1.58 + index * 0.115, 0]} scale={[0.36, 0.085, 0.32]} finish="bread" selected={selected} />)}
        </group>
      ))}
      <CarryingPoles width={1.15} length={2.6} y={1} finish="gold" selected={selected} />
    </group>
  );
}

function Lampstand({ selected }: { selected: boolean }) {
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <Part geometry={cylinder} position={[0, 0.12, 0]} scale={[0.62, 0.24, 0.62]} selected={selected} />
      <Part geometry={cylinder} position={[0, 1.75, 0]} scale={[0.09, 3.25, 0.09]} selected={selected} />
      {arms.map((geometry, index) => <Part key={index} geometry={geometry} selected={selected} />)}
      {[0.7, 1.2, 1.8, 2.4].map((y) => <Part key={y} geometry={sphere} position={[0, y, 0]} scale={[0.16, 0.12, 0.16]} finish="brightGold" selected={selected} />)}
      {[-3, -2, -1, 0, 1, 2, 3].map((index) => (
        <group key={index} position={[index * 0.53, 3.4, 0]}>
          <Part geometry={bowl} scale={[0.2, 0.24, 0.2]} finish="brightGold" selected={selected} />
          <Part geometry={ring} scale={[0.19, 0.19, 0.19]} rotation={[Math.PI / 2, 0, 0]} finish="brightGold" selected={selected} />
          <Part geometry={cylinder} position={[0, 0.01, 0]} scale={[0.13, 0.025, 0.13]} finish="darkBronze" selected={selected} />
          <Part position={[0, 0.055, 0.08]} scale={[0.03, 0.1, 0.035]} finish="wood" selected={selected} />
        </group>
      ))}
    </group>
  );
}

function Incense({ selected }: { selected: boolean }) {
  return (
    <group>
      <Part position={[0, 1, 0]} scale={[1, 2, 1]} selected={selected} />
      {[0.12, 1.86].map((y) => <Part key={y} position={[0, y, 0]} scale={[1.08, 0.14, 1.08]} finish="brightGold" selected={selected} />)}
      <Part position={[0, 2.015, 0]} scale={[0.75, 0.035, 0.75]} finish="darkBronze" selected={selected} />
      <Horns x={0.4} z={0.4} y={2} finish="gold" selected={selected} />
      <CarryingPoles width={0.66} length={2.3} y={1.45} finish="gold" selected={selected} />
    </group>
  );
}

function Ark({ selected }: { selected: boolean }) {
  return (
    <group>
      <Part position={[0, 0.75, 0]} scale={[2.5, 1.5, 1.5]} selected={selected} />
      <Part position={[0, 1.56, 0]} scale={[2.56, 0.12, 1.56]} finish="brightGold" selected={selected} />
      <Part position={[0, 0.12, 0]} scale={[2.56, 0.15, 1.56]} finish="brightGold" selected={selected} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Part position={[0, 0.8, side * 0.756]} scale={[2.17, 0.92, 0.025]} finish="brightGold" selected={selected} />
          <group position={[side * 0.9, 1.65, 0]} rotation={[0, 0, side * 0.16]}>
            <Part geometry={sphere} position={[0, 0.3, 0]} scale={[0.18, 0.35, 0.2]} selected={selected} />
            <Part geometry={sphere} position={[-side * 0.07, 0.72, 0]} scale={[0.16, 0.18, 0.16]} finish="brightGold" selected={selected} />
            {[-1, 1].map((wing) => <Part key={wing} geometry={sphere} position={[-side * 0.32, 0.75, wing * 0.25]} scale={[0.56, 0.09, 0.24]} rotation={[wing * 0.38, wing * 0.35, -side * 0.75]} finish="brightGold" selected={selected} />)}
          </group>
        </group>
      ))}
      <CarryingPoles width={1.43} length={3.7} y={0.75} finish="gold" selected={selected} />
    </group>
  );
}

export default function SanctuaryModel(props: SanctuaryModelProps) {
  const { selectedId, onSelect, texturesEnabled } = props;
  return (
    <TextureMode.Provider value={texturesEnabled}>
      <group name="sanctuary-model" dispose={null}>
        <Courtyard selectedId={selectedId} onSelect={onSelect} />
        <Tent {...props} />
        <Selectable id="altar" position={[0, 0, 25]} onSelect={onSelect}>
          <Altar selected={selectedId === 'altar'} />
        </Selectable>
        <Selectable id="basin" position={[0, 0, 8]} onSelect={onSelect}>
          <Basin selected={selectedId === 'basin'} />
        </Selectable>
        <Selectable id="table" position={[3, 0, -16]} onSelect={onSelect}>
          <Table selected={selectedId === 'table'} />
        </Selectable>
        <Selectable id="lampstand" position={[-3, 0, -16]} onSelect={onSelect}>
          <Lampstand selected={selectedId === 'lampstand'} />
        </Selectable>
        <Selectable id="incense" position={[0, 0, -23]} onSelect={onSelect}>
          <Incense selected={selectedId === 'incense'} />
        </Selectable>
        <Selectable id="ark" position={[0, 0, -30]} onSelect={onSelect}>
          <Ark selected={selectedId === 'ark'} />
        </Selectable>
      </group>
      <ModelEffects />
    </TextureMode.Provider>
  );
}
