import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useGlobalToast } from "../../../../shared/ui/GlobalToastContext";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { LoginForm } from "../forms/LoginForm";
import { resolveHomeRoute } from "@app/routing/access";

export const LoginPage = () => {
    const hasHydrated = useAuthSessionStore((s: AuthSessionState) => s.hasHydrated);
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const roles = useAuthSessionStore((s: AuthSessionState) => s.roles);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
    const logout = useAuthSessionStore((s: AuthSessionState) => s.actions.logout);
    const sessionExpiredNotice = useAuthSessionStore((s: AuthSessionState) => s.sessionExpiredNotice);
    const clearNotice = useAuthSessionStore((s: AuthSessionState) => s.actions.clearSessionExpiredNotice);
    const { show } = useGlobalToast();

    // Aviso único tras un cierre de sesión por vencimiento o 401.
    useEffect(() => {
        // Se lee y limpia del store (no del render) para que el doble efecto de
        // StrictMode no muestre el aviso dos veces.
        if (!sessionExpiredNotice || !useAuthSessionStore.getState().sessionExpiredNotice) return;
        clearNotice();
        show({
            severity: "warn",
            summary: "Sesión expirada",
            detail: "Tu sesión ha expirado. Inicia sesión nuevamente.",
            life: 6000,
        });
    }, [sessionExpiredNotice, show, clearNotice]);

    if (!hasHydrated) {
        return <main>Cargando...</main>;
    }

    if (status === "authenticated") {
        const homeRoute = resolveHomeRoute(roles, permissions);
        if (homeRoute) {
            return <Navigate to={homeRoute} replace />;
        }

        return (
            <main className="p-5">
                <p>Tu usuario no tiene permisos asignados para ingresar.</p>
                <button type="button" className="p-button p-component" data-cy="logout-button" onClick={logout}>
                    Cerrar sesión
                </button>
            </main>
        );
    }

    return (
        <main>
            <LoginForm />
        </main>
    );
};
