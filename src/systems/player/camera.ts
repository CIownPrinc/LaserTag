export function clampPitch(value: number) {
  return Math.max(-1.5, Math.min(1.5, value));
}
