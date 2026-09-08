import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three';

export type SurfaceTextureKind = 'sand' | 'linen' | 'wood' | 'metal' | 'leather';

const size = 128;
const textures = new Map<SurfaceTextureKind, DataTexture>();
const seeds: Record<SurfaceTextureKind, number> = {
  sand: 113,
  linen: 227,
  wood: 349,
  metal: 463,
  leather: 587,
};
const repetitions: Record<SurfaceTextureKind, readonly [number, number]> = {
  sand: [24, 24],
  linen: [6, 4],
  wood: [2, 2],
  metal: [4, 4],
  leather: [3, 3],
};

function grain(x: number, y: number, seed: number) {
  let value = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise(u: number, v: number, frequency: number, seed: number) {
  const x = u * frequency;
  const y = v * frequency;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = grain(ix % frequency, iy % frequency, seed);
  const b = grain((ix + 1) % frequency, iy % frequency, seed);
  const c = grain(ix % frequency, (iy + 1) % frequency, seed);
  const d = grain((ix + 1) % frequency, (iy + 1) % frequency, seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

export function getSurfaceTexture(kind: SurfaceTextureKind): DataTexture {
  if (!Object.hasOwn(seeds, kind)) throw new RangeError('Superfície procedural desconhecida.');
  const cached = textures.get(kind);
  if (cached) return cached;

  const seed = seeds[kind];
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      const fine = noise(u, v, 64, seed);
      const broad = noise(u, v, 8, seed);
      let shade: number;
      switch (kind) {
        case 'sand':
          shade = 224 + 18 * fine + 12 * broad;
          break;
        case 'linen':
          shade = 220 + 12 * Math.sin(u * Math.PI * 32) * Math.sin(v * Math.PI * 32) + 20 * fine;
          break;
        case 'wood':
          shade = 216 + 20 * Math.sin(u * Math.PI * 16 + 1.2 * Math.sin(v * Math.PI * 2)) + 16 * broad;
          break;
        case 'metal':
          shade = 236 + 10 * fine + 6 * noise(u, v, 32, seed + 1);
          break;
        case 'leather':
          shade = 222 + 20 * broad + 12 * fine;
          break;
      }
      const index = (y * size + x) * 4;
      const value = Math.round(Math.max(0, Math.min(255, shade)));
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }

  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.name = `sanctuary-surface-${kind}`;
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(...repetitions[kind]);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  textures.set(kind, texture);
  return texture;
}
