import { describe, expect, it, vi } from 'vitest';
import { LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, SRGBColorSpace, UnsignedByteType } from 'three';
import { getSurfaceTexture, type SurfaceTextureKind } from './surface-textures';

const kinds: SurfaceTextureKind[] = ['sand', 'linen', 'wood', 'metal', 'leather'];

function bytes(texture: ReturnType<typeof getSurfaceTexture>) {
  const data = texture.image.data;
  if (!(data instanceof Uint8Array)) throw new Error('A textura deve usar bytes RGBA.');
  return data;
}

describe('texturas procedurais de superfícies', () => {
  it.each(kinds)('gera %s em memória com modulação neutra e tamanho limitado', (kind) => {
    const texture = getSurfaceTexture(kind);
    const { width, height } = texture.image;
    const data = bytes(texture);
    expect(width).toBe(128);
    expect(height).toBe(128);
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.length).toBe(width * height * 4);
    const shades = new Set<number>();
    let neutralOpaque = true;
    for (let index = 0; index < data.length; index += 4) {
      shades.add(data[index]);
      neutralOpaque &&= data[index] === data[index + 1] && data[index] === data[index + 2] && data[index + 3] === 255;
    }
    expect(neutralOpaque).toBe(true);
    expect(shades.size).toBeGreaterThan(8);
    expect(Math.min(...shades)).toBeGreaterThanOrEqual(190);
    expect(Math.max(...shades)).toBeLessThanOrEqual(255);
    expect(texture.format).toBe(RGBAFormat);
    expect(texture.type).toBe(UnsignedByteType);
  });

  it.each(kinds)('configura %s como mapa de cor repetido com mipmaps', (kind) => {
    const texture = getSurfaceTexture(kind);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.wrapS).toBe(RepeatWrapping);
    expect(texture.wrapT).toBe(RepeatWrapping);
    expect(texture.repeat.x).toBeGreaterThan(1);
    expect(texture.repeat.y).toBeGreaterThan(1);
    expect(texture.generateMipmaps).toBe(true);
    expect(texture.magFilter).toBe(LinearFilter);
    expect(texture.minFilter).toBe(LinearMipmapLinearFilter);
  });

  it('reutiliza apenas cinco recursos sem alterar dados ao alternar superfícies', () => {
    const initial = kinds.map(getSurfaceTexture);
    const versions = initial.map((texture) => texture.version);
    for (let index = 0; index < 20; index += 1) {
      kinds.forEach((kind, kindIndex) => expect(getSurfaceTexture(kind)).toBe(initial[kindIndex]));
    }
    expect(new Set(initial).size).toBe(5);
    expect(initial.map((texture) => texture.version)).toEqual(versions);
    expect(new Set(initial.map((texture) => Array.from(bytes(texture)).join(','))).size).toBe(5);
  });

  it('rejeita tipos desconhecidos sem ampliar o cache de recursos', () => {
    expect(() => getSurfaceTexture('stone' as SurfaceTextureKind)).toThrow(RangeError);
    expect(() => getSurfaceTexture('toString' as SurfaceTextureKind)).toThrow(RangeError);
  });

  it('reproduz os mesmos bytes em uma nova instância do módulo sem aleatoriedade global', async () => {
    const original = kinds.map((kind) => bytes(getSurfaceTexture(kind)).slice());
    vi.resetModules();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.75);
    try {
      const fresh = await import('./surface-textures');
      kinds.forEach((kind, index) => {
        const texture = fresh.getSurfaceTexture(kind);
        expect(texture).not.toBe(getSurfaceTexture(kind));
        expect(texture.image.data).toEqual(original[index]);
      });
    } finally {
      random.mockRestore();
    }
  });
});
