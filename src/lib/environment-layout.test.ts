import { describe, expect, it } from 'vitest';
import {
  BIRD_ORBIT_RADIUS,
  BIRD_PERIOD,
  CLEARING_HALF_LENGTH,
  CLEARING_HALF_WIDTH,
  CLOUD_PERIOD,
  ENVIRONMENT_BUDGETS,
  ENVIRONMENT_FLOOR,
  SUN_POSITION,
  TERRAIN_SIZE,
  cloudDrift,
  createCloudLayout,
  createDesertDecorations,
  sampleBirdFlight,
  terrainHeight,
  terrainSurfaceHeight,
  type EnvironmentPoint,
} from './environment-layout';
import { PerspectiveCamera, Vector3 } from 'three';
import { fitCameraPosition, HORIZON, MAX_CAMERA_DISTANCE } from './model-layout';

const qualities = ['low', 'medium', 'high'] as const;

describe('terreno desértico determinístico', () => {
  it('mantém o pátio inteiro e a margem no nível original do chão', () => {
    for (let x = -CLEARING_HALF_WIDTH; x <= CLEARING_HALF_WIDTH; x += 5) {
      for (let z = -CLEARING_HALF_LENGTH; z <= CLEARING_HALF_LENGTH; z += 5) {
        expect(terrainHeight(x, z)).toBe(ENVIRONMENT_FLOOR);
      }
    }
  });

  it.each(qualities)('não interpola dunas através do pátio na qualidade %s', (quality) => {
    const { terrainSegments } = ENVIRONMENT_BUDGETS[quality];
    for (let x = -40; x <= 40; x += 2) {
      for (let z = -65; z <= 65; z += 2) {
        expect(terrainSurfaceHeight(x, z, terrainSegments)).toBeCloseTo(ENVIRONMENT_FLOOR, 8);
      }
    }
  });

  it('estende o terreno além da órbita máxima e do fim da névoa', () => {
    expect(TERRAIN_SIZE / 2 - MAX_CAMERA_DISTANCE).toBeGreaterThan(760);
  });

  it('produz dunas baixas e finitas sem aleatoriedade', () => {
    let maximum = ENVIRONMENT_FLOOR;
    for (let x = -TERRAIN_SIZE / 2; x <= TERRAIN_SIZE / 2; x += 29) {
      for (let z = -TERRAIN_SIZE / 2; z <= TERRAIN_SIZE / 2; z += 31) {
        const height = terrainHeight(x, z);
        expect(Number.isFinite(height)).toBe(true);
        expect(height).toBeGreaterThanOrEqual(ENVIRONMENT_FLOOR);
        expect(height).toBeLessThan(14);
        expect(height).toBe(terrainHeight(x, z));
        maximum = Math.max(maximum, height);
      }
    }
    expect(maximum).toBeGreaterThan(8);
  });

  it.each(qualities)('interpola a malha de terreno nos vértices em %s', (quality) => {
    const segments = ENVIRONMENT_BUDGETS[quality].terrainSegments;
    const cell = TERRAIN_SIZE / segments;
    for (let x = 0; x <= segments; x += 4) {
      for (let z = 0; z <= segments; z += 4) {
        const px = x * cell - TERRAIN_SIZE / 2;
        const pz = z * cell - TERRAIN_SIZE / 2;
        expect(terrainSurfaceHeight(px, pz, segments)).toBeCloseTo(terrainHeight(px, pz), 8);
      }
    }
  });
});

describe('vegetação e rochas fora da reconstrução', () => {
  it.each(['rock', 'bush'] as const)('mantém %s estável ao mudar a quantidade', (kind) => {
    const small = createDesertDecorations(kind, 24);
    const large = createDesertDecorations(kind, 76);
    expect(small).toEqual(large.slice(0, small.length));
    expect(createDesertDecorations(kind, 24)).toEqual(small);
    expect(createDesertDecorations(kind, 24)[0].position).not.toBe(small[0].position);
  });

  it.each(qualities)('mantém decoração esparsa e apoiada na malha em %s', (quality) => {
    const budget = ENVIRONMENT_BUDGETS[quality];
    for (const kind of ['rock', 'bush'] as const) {
      const count = kind === 'rock' ? budget.rocks : budget.bushes;
      const items = createDesertDecorations(kind, count, budget.terrainSegments);
      expect(items).toHaveLength(count);
      for (const item of items) {
        const [x, y, z] = item.position;
        const radius = Math.max(...item.scale) * 2;
        expect(Math.abs(x) - radius > 40 || Math.abs(z) - radius > 65).toBe(true);
        expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(110);
        expect(Math.hypot(x, z)).toBeLessThan(450);
        expect(y).toBe(terrainSurfaceHeight(x, z, budget.terrainSegments));
        expect(item.scale.every((value) => value > 0 && Number.isFinite(value))).toBe(true);
        if (kind === 'bush') expect(item.scale[1] * 2).toBeLessThan(1.9);
      }
    }
  });
});

describe('movimento ambiente limitado', () => {
  it('limita detalhes, sombras e aves por qualidade', () => {
    expect(ENVIRONMENT_BUDGETS.low.shadowMapSize).toBe(0);
    expect(ENVIRONMENT_BUDGETS.low.birds).toBe(0);
    for (const quality of ['medium', 'high'] as const) {
      expect(ENVIRONMENT_BUDGETS[quality].shadowMapSize).toBeLessThanOrEqual(2048);
      expect(ENVIRONMENT_BUDGETS[quality].birds).toBeGreaterThanOrEqual(2);
      expect(ENVIRONMENT_BUDGETS[quality].birds).toBeLessThanOrEqual(5);
    }
    expect(ENVIRONMENT_BUDGETS.low.terrainSegments).toBeLessThan(ENVIRONMENT_BUDGETS.medium.terrainSegments);
    expect(ENVIRONMENT_BUDGETS.medium.terrainSegments).toBeLessThan(ENVIRONMENT_BUDGETS.high.terrainSegments);
  });

  it('mantém aves longe de todas as posições da câmera e acima do pátio', () => {
    const point: EnvironmentPoint = [0, 0, 0];
    for (let bird = 0; bird < ENVIRONMENT_BUDGETS.high.birds; bird++) {
      for (let time = 0; time <= BIRD_PERIOD; time += 1) {
        expect(sampleBirdFlight(bird, time, point)).toBe(point);
        expect(Math.hypot(point[0], point[2])).toBeCloseTo(BIRD_ORBIT_RADIUS + bird * 7, 8);
        expect(Math.hypot(...point) - MAX_CAMERA_DISTANCE).toBeGreaterThan(150);
        expect(point[1]).toBeGreaterThanOrEqual(116);
        expect(point[1]).toBeLessThanOrEqual(150);
        const next = sampleBirdFlight(bird, time + 0.01, [0, 0, 0]);
        expect(Math.hypot(...point.map((coordinate, index) => coordinate - next[index]))).toBeLessThan(0.2);
      }
    }
  });

  it('fecha a trajetória das aves sem teletransporte nem objetos compartilhados', () => {
    for (let bird = 0; bird < 5; bird++) {
      const start = sampleBirdFlight(bird, 0, [0, 0, 0]);
      const end = sampleBirdFlight(bird, BIRD_PERIOD, [0, 0, 0]);
      start.forEach((coordinate, index) => expect(coordinate).toBeCloseTo(end[index], 8));
      expect(end).not.toBe(start);
    }
  });

  it('gera nuvens esparsas, altas e estáveis entre qualidades', () => {
    const clouds = createCloudLayout(7);
    expect(createCloudLayout(3)).toEqual(clouds.slice(0, 3));
    expect(createCloudLayout(7)).toEqual(clouds);
    for (const cloud of clouds) {
      expect(cloud.position[1]).toBeGreaterThanOrEqual(125);
      expect(cloud.position[1]).toBeLessThan(170);
      expect(Math.hypot(cloud.position[0], cloud.position[2])).toBeGreaterThanOrEqual(400);
    }
    for (let time = 0; time <= CLOUD_PERIOD * 2; time += 10) {
      expect(Math.abs(cloudDrift(time))).toBeLessThanOrEqual(32);
      expect(Math.abs(cloudDrift(time + 1) - cloudDrift(time))).toBeLessThan(0.21);
    }
    expect(cloudDrift(0)).toBeCloseTo(cloudDrift(CLOUD_PERIOD), 8);
  });

  it.each([1.8, 1, 0.65])('enquadra sol, nuvens e aves na vista de horizonte com aspecto %s', (aspect) => {
    const camera = new PerspectiveCamera(40, aspect, 0.1, 1000);
    camera.position.set(...fitCameraPosition(HORIZON.position, HORIZON.target, aspect));
    camera.lookAt(...HORIZON.target);
    camera.updateMatrixWorld();
    expect(camera.position.distanceTo(new Vector3(...HORIZON.target))).toBeLessThan(MAX_CAMERA_DISTANCE);
    const sun = new Vector3(...SUN_POSITION).normalize().multiplyScalar(10000).project(camera);
    expect(Math.abs(sun.x)).toBeLessThan(0.95);
    expect(Math.abs(sun.y)).toBeLessThan(0.95);
    const visible = (point: EnvironmentPoint) => {
      const projected = new Vector3(...point).project(camera);
      return Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && Math.abs(projected.z) < 1;
    };
    expect(createCloudLayout(3).some((cloud) => visible(cloud.position))).toBe(true);
    expect(visible(sampleBirdFlight(0, 0, [0, 0, 0]))).toBe(true);
  });

  it('usa uma única direção solar elevada', () => {
    expect(SUN_POSITION.every(Number.isFinite)).toBe(true);
    expect(SUN_POSITION[1]).toBeGreaterThan(0);
  });
});
