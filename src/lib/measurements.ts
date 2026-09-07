export const CUBIT_METERS = 0.4572;
export type MeasurementUnit = "cubits" | "meters" | "feet";

export function convertCubits(value: number, unit: MeasurementUnit): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("A medida deve ser finita e não negativa.");
  if (unit === "cubits") return value;
  const meters = value * CUBIT_METERS;
  return unit === "meters" ? meters : meters / 0.3048;
}

export function formatDimension(value: number, unit: MeasurementUnit): string {
  const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(convertCubits(value, unit));
  if (unit === "cubits") return `${number} ${value === 1 ? "côvado" : "côvados"}`;
  return `≈ ${number} ${unit === "meters" ? "m" : "pés"}`;
}
