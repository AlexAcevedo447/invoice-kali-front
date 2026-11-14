// Helper para obtener el token fuera de React
export function getAccessToken() {
  return useAuthSessionStore.getState().accessToken;
}
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ApplicationServices } from "../application/Application";
import type { AuthSession } from "../../modules/auth-context/domain/entities/AuthSession";
import { HttpError } from "../../shared/application/http/HttpError";
import type { SessionEndReason } from "../../shared/application/http/sessionEnd";
import { decodeJwtClaims } from "../../shared/infrastructure/jwt/decodeJwtClaims";

type AuthContextService = ApplicationServices["authContext"];
type SessionPermission = AuthSession["permissions"][number];
const AUTH_SESSION_STORAGE_KEY = "auth-session-store";

interface LoginPayload {
  email: string;
  password: string;
  /** Código legible de empresa: solo cuando el servidor lo exige. */
  tenantCode?: string;
}

export interface AuthSessionState {
  hasHydrated: boolean;
  status: "anonymous" | "authenticated";
  accessToken: string | null;
  tenantId: string | null;
  tenantName: string | null;
  /** Empresa de plataforma: habilita la administración de empresas en la interfaz. */
  isPlatformTenant: boolean;
  userId: string | null;
  email: string | null;
  roles: string[];
  permissions: SessionPermission[];
  /** Momento (epoch ms) en que vence el access token. */
  expiresAt: number | null;
  /** Indica a la pantalla de login que debe avisar que la sesión expiró. */
  sessionExpiredNotice: boolean;
  /** Motivo del último cierre forzado de sesión (para el aviso del login). */
  sessionEndReason: SessionEndReason | null;
  isLoading: boolean;
  error: string | null;
  actions: {
    login(payload: LoginPayload): Promise<{ success: boolean; error?: string; status?: number }>;
    logout(): void;
    /** Cierra la sesión por vencimiento/401 y deja pendiente el aviso. */
    expireSession(reason?: SessionEndReason): void;
    clearSessionExpiredNotice(): void;
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
      tenantName: null,
      isPlatformTenant: false,
      userId: null,
      email: null,
      roles: [],
      permissions: [],
      expiresAt: null,
      sessionExpiredNotice: false,
      sessionEndReason: null,
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
            const session = await authContextService.auth.login(payload);
            set({
              status: "authenticated",
              accessToken: session.accessToken,
              tenantId: String(session.tenantId),
              tenantName: session.tenantName,
              isPlatformTenant: session.isPlatformTenant,
              userId: String(session.userId),
              email: session.email,
              roles: session.roles,
              permissions: session.permissions,
              expiresAt: Date.now() + session.expiresIn * 1000,
              sessionExpiredNotice: false,
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
            const status = error instanceof HttpError ? error.status : undefined;
            return { success: false, error: errorMsg, status };
          }
        },
        logout() {
          set({
            status: "anonymous",
            accessToken: null,
            tenantId: null,
            tenantName: null,
            isPlatformTenant: false,
            userId: null,
            email: null,
            roles: [],
            permissions: [],
            expiresAt: null,
            isLoading: false,
            error: null,
          });
          // Elimina también la sesión persistida (token incluido) de localStorage.
          useAuthSessionStore.persist.clearStorage();
        },
        expireSession(reason = "expired") {
          // Idempotente: varias peticiones 401/403 simultáneas no repiten el cierre.
          if (get().status !== "authenticated") return;
          get().actions.logout();
          set({ sessionExpiredNotice: true, sessionEndReason: reason });
        },
        clearSessionExpiredNotice() {
          set({ sessionExpiredNotice: false });
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
        tenantName: state.tenantName,
        isPlatformTenant: state.isPlatformTenant,
        userId: state.userId,
        email: state.email,
        roles: state.roles,
        permissions: state.permissions,
        expiresAt: state.expiresAt,
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

/**
 * Vencimiento de la sesión en epoch ms. Usa `expiresAt` (de `expires_in`) y,
 * para sesiones guardadas antes de existir ese campo, el claim `exp` del JWT.
 */
export function getSessionExpiry(
  state: Pick<AuthSessionState, "expiresAt" | "accessToken">,
): number | null {
  if (typeof state.expiresAt === "number") return state.expiresAt;
  if (!state.accessToken) return null;
  try {
    const { exp } = decodeJwtClaims(state.accessToken);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isSessionExpired(
  state: Pick<AuthSessionState, "expiresAt" | "accessToken">,
  now = Date.now(),
): boolean {
  const expiry = getSessionExpiry(state);
  return expiry !== null && expiry <= now;
}

/** Helper para cerrar la sesión vencida fuera de React (cliente HTTP). */
export function expireSession(reason?: SessionEndReason): void {
  useAuthSessionStore.getState().actions.expireSession(reason);
}
