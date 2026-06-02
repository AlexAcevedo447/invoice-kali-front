export const HealthEndpoints = {
  root: "/",
  health: "/health",
} as const;

export type HealthEndpoints = typeof HealthEndpoints;
