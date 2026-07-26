// Helper para obtener el token fuera de React
export function getAccessToken() {
  return useAuthSessionStore.getState().accessToken;
}
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ApplicationServices } from "../application/Application";
import type { AuthSession } from "../../modules/auth-context/domain/entities/AuthSession";
import { toTenantId } from "../../modules/auth-context/domain/value-objects/TenantId";

type AuthContextService = ApplicationServices["authContext"];
type SessionPermission = AuthSession["permissions"][number];
const AUTH_SESSION_STORAGE_KEY = "auth-session-store";

interface LoginPayload {
  tenantId: string;
  email: string;
  password: string;
}

export interface AuthSessionState {
  hasHydrated: boolean;
  status: "anonymous" | "authenticated";
  accessToken: string | null;
  tenantId: string | null;
  userId: string | null;
  email: string | null;
  roles: string[];
  permissions: SessionPermission[];
  isLoading: boolean;
  error: string | null;
  actions: {
    login(payload: LoginPayload): Promise<{ success: boolean; error?: string }>;
    logout(): void;
    clearError(): void;
    hasRole(role: string): boolean;
    can(resource: string, action: string): boolean;
    markHydrated(): void;
  };
}

let authContextService: AuthContextService | null = null;

export const configureAuthSessionStore = (
  service: AuthContextService,
): void => {
  authContextService = service;
};
export const useAuthSessionStore = create<AuthSessionState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      status: "anonymous",
      accessToken: null,
      tenantId: null,
      userId: null,
      email: null,
      roles: [],
      permissions: [],
      isLoading: false,
      error: null,
      actions: {
        async login(payload) {
          if (!authContextService)
            throw new Error("AuthContextService is not configurado");
          if (get().isLoading)
            return { success: false, error: "Ya en progreso" };
          set({ isLoading: true, error: null });
          try {
            const session = await authContextService.auth.login({
              ...payload,
              tenantId: toTenantId(payload.tenantId),
            });
            set({
              status: "authenticated",
              accessToken: session.accessToken,
              tenantId: String(session.tenantId),
              userId: String(session.userId),
              email: session.email,
              roles: session.roles,
              permissions: session.permissions,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : "Unexpected error";
            set({
              isLoading: false,
              error: errorMsg,
            });
            return { success: false, error: errorMsg };
          }
        },
        logout() {
          set({
            status: "anonymous",
            accessToken: null,
            tenantId: null,
            userId: null,
            email: null,
            roles: [],
            permissions: [],
            isLoading: false,
            error: null,
          });
        },
        clearError() {
          set({ error: null });
        },
        hasRole(role) {
          const expectedRole = role.trim().toLowerCase();
          return get().roles.some(
            (currentRole) => currentRole.trim().toLowerCase() === expectedRole,
          );
        },
        can(resource, action) {
          const normalize = (v: string) => v.trim().toLowerCase();
          return get().permissions.some(
            (p) =>
              (normalize(p.resource) === normalize(resource) ||
                normalize(p.resource) === "*") &&
              (normalize(p.action) === normalize(action) ||
                normalize(p.action) === "*"),
          );
        },
        markHydrated() {
          set({ hasHydrated: true });
        },
      },
    }),
    {
      name: AUTH_SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        if (typeof persistedState !== "object" || persistedState === null) {
          return persistedState as AuthSessionState;
        }

        const candidate = persistedState as Partial<AuthSessionState>;
        const token = candidate.accessToken;
        const hasToken = typeof token === "string" && token.length > 0;

        if (candidate.status == null && hasToken) {
          return {
            ...candidate,
            status: "authenticated",
          } as AuthSessionState;
        }

        return persistedState as AuthSessionState;
      },
      partialize: (state) => ({
        status: state.status,
        accessToken: state.accessToken,
        tenantId: state.tenantId,
        userId: state.userId,
        email: state.email,
        roles: state.roles,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.actions.markHydrated();
          return;
        }

        useAuthSessionStore.setState({ hasHydrated: true });
      },
    },
  ),
);
