import type { ElementId } from '../content/sanctuary';

export type Point3 = [number, number, number];
export const MAX_CAMERA_DISTANCE = 380;

export const OVERVIEW: { position: Point3; target: Point3 } = {
  position: [80, 78, 112],
  target: [0, 0, 0],
};

export const modelLayout: Record<
  ElementId,
  { position: Point3; camera: Point3; target: Point3; interior: boolean }
> = {
  gate: {
    position: [0, 7, 50],
    camera: [29, 24, 78],
    target: [0, 2.5, 45],
    interior: false,
  },
  altar: {
    position: [0, 5.5, 25],
    camera: [15, 16, 44],
    target: [0, 1.5, 25],
    interior: false,
  },
  basin: {
    position: [0, 4.5, 8],
    camera: [12, 13, 21],
    target: [0, 1.5, 8],
    interior: false,
  },
  table: {
    position: [3, 3.4, -16],
    camera: [14, 18, -5],
    target: [2, 1, -16],
    interior: true,
  },
  lampstand: {
    position: [-3, 5.2, -16],
    camera: [-15, 18, -5],
    target: [-2, 1.8, -16],
    interior: true,
  },
  incense: {
    position: [0, 3.8, -23],
    camera: [11, 18, -10],
    target: [0, 1.2, -23],
    interior: true,
  },
  veil: {
    position: [0, 11.5, -25],
    camera: [0, 20, -12],
    target: [0, 4, -25],
    interior: true,
  },
  ark: {
    position: [0, 4.5, -30],
    camera: [12, 18, -18],
    target: [0, 1.5, -30],
    interior: true,
  },
  christ: {
    position: [0, 0, 0],
    camera: [...OVERVIEW.position],
    target: [...OVERVIEW.target],
    interior: false,
  },
};

export function fitCameraPosition(position: Point3, target: Point3, aspect: number): Point3 {
  const offset = position.map((value, index) => value - target[index]);
  const distance = Math.hypot(...offset);
  if (distance === 0) return [...position];
  const scale = Math.min(Math.max(1, 1.1 / Math.max(aspect, 0.4)), (MAX_CAMERA_DISTANCE - 1) / distance);
  return [target[0] + offset[0] * scale, target[1] + offset[1] * scale, target[2] + offset[2] * scale];
}

export function isHotspotVisible(id: ElementId, selectedId: ElementId | null, roofVisible: boolean, wallsVisible: boolean): boolean {
  if (id === 'christ') return false;
  if (id === 'veil') return wallsVisible && !roofVisible;
  if (!modelLayout[id].interior) return true;
  return !roofVisible && !wallsVisible && selectedId !== null && modelLayout[selectedId].interior;
}
