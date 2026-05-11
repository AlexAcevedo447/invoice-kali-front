import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ApplicationServices } from "../application/Application";
import type { AuthSession } from "@modules/auth-context/domain/entities";
import { toTenantId } from "../../modules/auth-context/domain/value-objects/TenantId";

type AuthContextService = ApplicationServices["authContext"];
type SessionPermission = AuthSession["permissions"][number];
const AUTH_SESSION_STORAGE_KEY = "auth-session-store";

interface PersistedAuthSessionSlice {
  status?: "anonymous" | "authenticated";
  accessToken?: string | null;
  tenantId?: string | null;
  userId?: string | null;
  email?: string | null;
  roles?: string[];
  permissions?: SessionPermission[];
}

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
    login(payload: LoginPayload): Promise<void>;
    logout(): void;
    clearError(): void;
    hasRole(role: string): boolean;
    can(resource: string, action: string): boolean;
    markHydrated(): void;
  };
}

let authContextService: AuthContextService | null = null;

const getPersistedAuthSessionSlice = (): PersistedAuthSessionSlice => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as { state?: PersistedAuthSessionSlice };
    return parsed.state ?? {};
  } catch {
    return {};
  }
};

const normalize = (value: string): string => value.trim().toLowerCase();

const matchesResource = (
  permissionResource: string,
  resource: string,
): boolean => {
  const current = normalize(permissionResource);
  const target = normalize(resource);

  if (current === "*") {
    return true;
  }

  return (
    current === target ||
    current.startsWith(`${target}:`) ||
    current.startsWith(`${target}.`) ||
    current.startsWith(`${target}/`)
  );
};

const matchesAction = (permissionAction: string, action: string): boolean => {
  const current = normalize(permissionAction);
  const target = normalize(action);

  return current === "*" || current === target;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
};

export const configureAuthSessionStore = (
  service: AuthContextService,
): void => {
  authContextService = service;
};

const persistedAuthSession = getPersistedAuthSessionSlice();
const persistedStatus =
  persistedAuthSession.status === "authenticated" ||
  (persistedAuthSession.status == null &&
    typeof persistedAuthSession.accessToken === "string" &&
    persistedAuthSession.accessToken.length > 0)
    ? "authenticated"
    : "anonymous";

export const useAuthSessionStore = create<AuthSessionState>()(
  persist(
    (set, get) => ({
      hasHydrated: true,
      status: persistedStatus,
      accessToken: persistedAuthSession.accessToken ?? null,
      tenantId: persistedAuthSession.tenantId ?? null,
      userId: persistedAuthSession.userId ?? null,
      email: persistedAuthSession.email ?? null,
      roles: persistedAuthSession.roles ?? [],
      permissions: persistedAuthSession.permissions ?? [],
      isLoading: false,
      error: null,
      actions: {
        async login(payload) {
          if (!authContextService) {
            throw new Error("AuthContextService is not configured");
          }

          if (get().isLoading) {
            return;
          }

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
          } catch (error) {
            set({
              isLoading: false,
              error: getErrorMessage(error),
            });
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
          const expectedRole = normalize(role);
          return get().roles.some(
            (currentRole) => normalize(currentRole) === expectedRole,
          );
        },

        can(resource, action) {
          return get().permissions.some(
            (p) =>
              matchesResource(p.resource, resource) &&
              matchesAction(p.action, action),
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
