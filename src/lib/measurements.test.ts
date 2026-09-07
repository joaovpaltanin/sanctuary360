import { describe, expect, it } from "vitest";
import { CUBIT_METERS, convertCubits, formatDimension } from "./measurements";

describe("medidas em côvados", () => {
  it("converte usando a convenção declarada", () => {
    expect(CUBIT_METERS).toBe(0.4572);
    expect(convertCubits(5, "meters")).toBeCloseTo(2.286);
    expect(convertCubits(5, "feet")).toBeCloseTo(7.5);
    expect(convertCubits(2.5, "cubits")).toBe(2.5);
    expect(convertCubits(0, "meters")).toBe(0);
  });

  it("formata números em português e indica aproximações", () => {
    expect(formatDimension(5, "meters")).toBe("≈ 2,29 m");
    expect(formatDimension(2.5, "cubits")).toBe("2,5 côvados");
    expect(formatDimension(1, "cubits")).toBe("1 côvado");
    expect(formatDimension(5, "feet")).toBe("≈ 7,5 pés");
  });

  it.each([-1, NaN, Infinity, -Infinity])("rejeita medida inválida %s", (value) => {
    expect(() => convertCubits(value, "meters")).toThrow(RangeError);
  });
});
