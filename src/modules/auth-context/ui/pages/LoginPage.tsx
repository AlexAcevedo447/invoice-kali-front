import { useEffect } from "react";
import { SESSION_END_MESSAGES } from "@shared/application/http/sessionEnd";
import { Navigate } from "react-router-dom";
import { useGlobalToast } from "../../../../shared/ui/GlobalToastContext";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { LoginForm } from "../forms/LoginForm";
import { resolveHomeRoute } from "@app/routing/access";
import { ROUTES } from "@app/routing/routes";

export const LoginPage = () => {
    const hasHydrated = useAuthSessionStore((s: AuthSessionState) => s.hasHydrated);
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const roles = useAuthSessionStore((s: AuthSessionState) => s.roles);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
    const isPlatformTenant = useAuthSessionStore((s: AuthSessionState) => s.isPlatformTenant);
    const sessionExpiredNotice = useAuthSessionStore((s: AuthSessionState) => s.sessionExpiredNotice);
    const clearNotice = useAuthSessionStore((s: AuthSessionState) => s.actions.clearSessionExpiredNotice);
    const { show } = useGlobalToast();

    // Aviso único tras un cierre de sesión por vencimiento o 401.
    useEffect(() => {
        // Se lee y limpia del store (no del render) para que el doble efecto de
        // StrictMode no muestre el aviso dos veces.
        if (!sessionExpiredNotice || !useAuthSessionStore.getState().sessionExpiredNotice) return;
        const reason = useAuthSessionStore.getState().sessionEndReason ?? "expired";
        clearNotice();
        show({ severity: "warn", ...SESSION_END_MESSAGES[reason], life: 6000 });
    }, [sessionExpiredNotice, show, clearNotice]);

    if (!hasHydrated) {
        return <main>Cargando...</main>;
    }

    if (status === "authenticated") {
        // Sesión válida: al módulo que corresponda o, sin permisos, a la pantalla
        // "Sin acceso a módulos" (dentro de la sesión, con su botón de cerrar sesión).
        const homeRoute = resolveHomeRoute(roles, permissions, isPlatformTenant);
        return <Navigate to={homeRoute ?? ROUTES.noAccess} replace />;
    }

    return (
        <main>
            <LoginForm />
        </main>
    );
};
