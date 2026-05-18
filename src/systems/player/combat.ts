export function getFireRate(rapidfireExpiresAt: number, now: number) {
  return rapidfireExpiresAt > now ? 50 : 200;
}
