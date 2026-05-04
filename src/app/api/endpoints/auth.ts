export const AuthEndpoints = {
  login: "/api/v1/auth/login",
  authorize: "/api/v1/auth/authorize",
} as const;

export type AuthEndpoints = typeof AuthEndpoints;
