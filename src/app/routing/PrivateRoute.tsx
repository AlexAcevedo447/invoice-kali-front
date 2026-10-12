import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import { isSessionExpired, useAuthSessionStore } from "../state/authSessionStore";
import type { AuthSessionState } from "../state/authSessionStore";
import { ROUTES } from "./routes";

export const PrivateRoute = () => {
    const hasHydrated = useAuthSessionStore((s: AuthSessionState) => s.hasHydrated);
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const isLoading = useAuthSessionStore((s: AuthSessionState) => s.isLoading);
    const expired = useAuthSessionStore(
        (s: AuthSessionState) => s.status === "authenticated" && isSessionExpired(s)
    );
    const expire = useAuthSessionStore((s: AuthSessionState) => s.actions.expireSession);

    // Sesión guardada pero vencida: se cierra (fuera del render) y se redirige al login.
    useEffect(() => {
        if (expired) expire();
    }, [expired, expire]);

    if (!hasHydrated || isLoading || expired) {
        return <main>Cargando...</main>;
    }

    if (status !== "authenticated") {
        return <Navigate to={ROUTES.login} replace />;
    }

    return <AppLayout />;
};
