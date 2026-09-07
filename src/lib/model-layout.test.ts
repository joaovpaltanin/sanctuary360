import { describe, expect, it } from 'vitest';
import { elementIds, elements, type ElementId } from '../content/sanctuary';
import { fitCameraPosition, isHotspotVisible, MAX_CAMERA_DISTANCE, modelLayout, OVERVIEW, type Point3 } from './model-layout';

const interiorIds: ElementId[] = ['table', 'lampstand', 'incense', 'veil', 'ark'];
const physicalIds = elementIds.filter((id) => id !== 'christ');
const expectedAnchors: Record<(typeof physicalIds)[number], Point3> = {
  gate: [0, 7, 50],
  altar: [0, 5.5, 25],
  basin: [0, 4.5, 8],
  table: [3, 3.4, -16],
  lampstand: [-3, 5.2, -16],
  incense: [0, 3.8, -23],
  veil: [0, 11.5, -25],
  ark: [0, 4.5, -30],
};

function expectFinitePoint(point: Point3) {
  expect(point).toHaveLength(3);
  expect(point.every((coordinate) => Number.isFinite(coordinate))).toBe(true);
}

function distance(a: Point3, b: Point3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe('layout esquemático em côvados', () => {
  it('cobre todos os identificadores editoriais sem entradas extras', () => {
    expect(Object.keys(modelLayout).sort()).toEqual([...elementIds].sort());
    expect(Object.keys(modelLayout).sort()).toEqual(elements.map(({ id }) => id).sort());
  });

  it('preserva a câmera de visão geral e sua orientação', () => {
    expect(OVERVIEW.position).toEqual([80, 78, 112]);
    expect(OVERVIEW.target).toEqual([0, 0, 0]);
    expectFinitePoint(OVERVIEW.position);
    expectFinitePoint(OVERVIEW.target);
  });

  it.each(elementIds)('mantém pontos finitos e câmera afastada do alvo em %s', (id) => {
    const { position, camera, target } = modelLayout[id];
    expectFinitePoint(position);
    expectFinitePoint(camera);
    expectFinitePoint(target);
    expect(camera[1]).toBeGreaterThan(target[1]);
    expect(distance(camera, target)).toBeGreaterThan(12);
    expect(distance(camera, position)).toBeGreaterThan(10);
  });

  it.each(elementIds)('classifica corretamente a camada interior de %s', (id) => {
    const content = elements.find((element) => element.id === id)!;
    const isInteriorZone = content.zone === 'Lugar Santo' || content.zone === 'Lugar Santíssimo';
    expect(modelLayout[id].interior).toBe(interiorIds.includes(id));
    expect(modelLayout[id].interior).toBe(isInteriorZone);
  });

  it.each(physicalIds)('posiciona o hotspot de %s acima do objeto e dentro do pátio', (id) => {
    const { position, target } = modelLayout[id];
    expect(position).toEqual(expectedAnchors[id]);
    expect(position[1]).toBeGreaterThan(target[1]);
    expect(Math.abs(position[0])).toBeLessThanOrEqual(25);
    expect(Math.abs(position[2])).toBeLessThanOrEqual(50);
  });

  it.each(interiorIds)('enquadra %s por cima da tenda para exploração em corte', (id) => {
    const { position, camera, target } = modelLayout[id];
    expect(Math.abs(position[0])).toBeLessThan(5);
    expect(position[2]).toBeGreaterThan(-35);
    expect(position[2]).toBeLessThan(-5);
    expect(camera[1]).toBeGreaterThanOrEqual(18);
    expect(camera[1]).toBeLessThanOrEqual(22);
    expect(Math.abs(target[0])).toBeLessThan(5);
    expect(target[2]).toBeGreaterThan(-35);
    expect(target[2]).toBeLessThan(-5);
  });

  it('mantém o percurso leste-oeste e os móveis em seus compartimentos', () => {
    expect(modelLayout.gate.position[2]).toBe(50);
    expect(modelLayout.gate.position[1]).toBe(7);
    expect(modelLayout.altar.position[2]).toBeGreaterThan(modelLayout.basin.position[2]);
    expect(modelLayout.basin.position[2]).toBeGreaterThan(-5);
    expect(modelLayout.table.position[0]).toBe(3);
    expect(modelLayout.lampstand.position[0]).toBe(-3);
    expect(modelLayout.table.position[2]).toBe(modelLayout.lampstand.position[2]);
    expect(modelLayout.veil.position[2]).toBe(-25);
    for (const id of ['table', 'lampstand', 'incense'] as const) {
      expect(modelLayout[id].position[2]).toBeGreaterThan(modelLayout.veil.position[2]);
    }
    expect(modelLayout.ark.position[2]).toBeLessThan(modelLayout.veil.position[2]);
  });

  it('mantém todos os destinos dentro dos limites de órbita em telas estreitas', () => {
    for (const id of elementIds) {
      const { camera, target } = modelLayout[id];
      for (const aspect of [0, 0.2, 0.4, 0.8, 2]) {
        const position = fitCameraPosition(camera, target, aspect);
        expectFinitePoint(position);
        expect(distance(position, target)).toBeLessThan(MAX_CAMERA_DISTANCE);
      }
    }
  });

  it('olha para o véu sem cruzar as paredes laterais', () => {
    expect(modelLayout.veil.camera[0]).toBe(0);
    expect(modelLayout.veil.target[0]).toBe(0);
    expect(modelLayout.veil.camera[2]).toBeGreaterThan(-25);
    expect(modelLayout.veil.camera[2]).toBeLessThan(-5);
  });

  it('só mostra marcadores internos com as camadas correspondentes visíveis', () => {
    expect(isHotspotVisible('veil', null, false, false)).toBe(false);
    expect(isHotspotVisible('veil', 'veil', false, true)).toBe(true);
    expect(isHotspotVisible('veil', 'veil', true, true)).toBe(false);
    expect(isHotspotVisible('ark', 'ark', false, false)).toBe(true);
    expect(isHotspotVisible('ark', 'ark', true, false)).toBe(false);
    expect(isHotspotVisible('ark', 'ark', false, true)).toBe(false);
    expect(isHotspotVisible('altar', null, true, true)).toBe(true);
    expect(isHotspotVisible('christ', 'christ', false, false)).toBe(false);
  });

  it('usa a visão geral para a síntese sobre Cristo, sem um objeto físico', () => {
    expect(modelLayout.christ.position).toEqual([0, 0, 0]);
    expect(modelLayout.christ.camera).toEqual(OVERVIEW.position);
    expect(modelLayout.christ.target).toEqual(OVERVIEW.target);
    expect(modelLayout.christ.interior).toBe(false);
    expect(modelLayout.christ.camera).not.toBe(OVERVIEW.position);
    expect(modelLayout.christ.target).not.toBe(OVERVIEW.target);
  });
});
