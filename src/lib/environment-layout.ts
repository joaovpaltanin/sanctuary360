export type EnvironmentQuality = 'low' | 'medium' | 'high';
export type EnvironmentPoint = [number, number, number];

export const ENVIRONMENT_FLOOR = -0.3;
export const TERRAIN_SIZE = 2600;
export const CLEARING_HALF_WIDTH = 80;
export const CLEARING_HALF_LENGTH = 105;
export const BIRD_ORBIT_RADIUS = 520;
export const BIRD_PERIOD = 240;
export const CLOUD_PERIOD = 960;
export const SUN_POSITION: EnvironmentPoint = [-100, 38, -150];

export const ENVIRONMENT_BUDGETS = {
  low: { terrainSegments: 64, rocks: 24, bushes: 28, clouds: 3, birds: 0, shadowMapSize: 0 },
  medium: { terrainSegments: 96, rocks: 44, bushes: 52, clouds: 5, birds: 3, shadowMapSize: 1024 },
  high: { terrainSegments: 128, rocks: 64, bushes: 76, clouds: 7, birds: 5, shadowMapSize: 2048 },
} as const;

export interface DesertDecoration {
  position: EnvironmentPoint;
  scale: EnvironmentPoint;
  rotation: number;
  phase: number;
  shade: number;
}

function smoothstep(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

export function terrainHeight(x: number, z: number) {
  const distance = Math.hypot(
    Math.max(0, Math.abs(x) - CLEARING_HALF_WIDTH),
    Math.max(0, Math.abs(z) - CLEARING_HALF_LENGTH),
  );
  const blend = smoothstep(distance / 100);
  const ridges = 6 + 4 * Math.sin(x * 0.013 + z * 0.008)
    + 2.4 * Math.sin(z * 0.023 - x * 0.006)
    + 1.5 * Math.cos(x * 0.031 + z * 0.017);
  return ENVIRONMENT_FLOOR + blend * Math.max(0, ridges);
}

export function terrainSurfaceHeight(x: number, z: number, segments: number) {
  const cellSize = TERRAIN_SIZE / segments;
  const cellX = Math.floor((x + TERRAIN_SIZE / 2) / cellSize);
  const cellZ = Math.floor((z + TERRAIN_SIZE / 2) / cellSize);
  const x0 = cellX * cellSize - TERRAIN_SIZE / 2;
  const z0 = cellZ * cellSize - TERRAIN_SIZE / 2;
  const u = (x - x0) / cellSize;
  const v = (z - z0) / cellSize;
  const b = terrainHeight(x0, z0 + cellSize);
  const d = terrainHeight(x0 + cellSize, z0);
  if (u + v <= 1) {
    const a = terrainHeight(x0, z0);
    return a + (b - a) * v + (d - a) * u;
  }
  const c = terrainHeight(x0 + cellSize, z0 + cellSize);
  return c + (b - c) * (1 - u) + (d - c) * (1 - v);
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function createDesertDecorations(kind: 'rock' | 'bush', count: number, terrainSegments: number = ENVIRONMENT_BUDGETS.medium.terrainSegments): DesertDecoration[] {
  const random = seededRandom(kind === 'rock' ? 36017 : 36029);
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const radius = 110 + random() * 340;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const size = kind === 'bush' ? 0.65 + random() * 0.8 : 0.55 + random() * 1.8;
    return {
      position: [x, terrainSurfaceHeight(x, z, terrainSegments), z],
      scale: [size * (1 + random() * 0.6), size * (kind === 'bush' ? 0.65 : 0.55), size],
      rotation: random() * Math.PI * 2,
      phase: random() * Math.PI * 2,
      shade: random(),
    };
  });
}

export function createCloudLayout(count: number): DesertDecoration[] {
  const random = seededRandom(36043);
  return Array.from({ length: count }, (_, index) => {
    const angle = 3.9 + index * 2.399963229728653;
    const radius = 400 + random() * 100;
    return {
      position: [Math.cos(angle) * radius, 125 + random() * 45, Math.sin(angle) * radius],
      scale: [22 + random() * 18, 3 + random() * 3, 9 + random() * 8],
      rotation: random() * Math.PI,
      phase: random() * Math.PI * 2,
      shade: random(),
    };
  });
}

export function cloudDrift(time: number) {
  return Math.sin(time * Math.PI * 2 / CLOUD_PERIOD) * 32;
}

export function sampleBirdFlight(index: number, time: number, target: EnvironmentPoint): EnvironmentPoint {
  const angle = time * Math.PI * 2 / BIRD_PERIOD + 4.0 + index * 0.037;
  const radius = BIRD_ORBIT_RADIUS + index * 7;
  target[0] = Math.cos(angle) * radius;
  target[1] = 125 + index * 4 + Math.sin(angle * 2 + index * 0.3) * 9;
  target[2] = Math.sin(angle) * radius;
  return target;
}
