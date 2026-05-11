import { Navigate, Outlet } from "react-router-dom";
import { useAuthSessionStore } from "../state/authSessionStore";
import type { AuthSessionState } from "../state/authSessionStore";
import { ROUTES } from "./routes";

export const PrivateRoute = () => {
    const hasHydrated = useAuthSessionStore((s: AuthSessionState) => s.hasHydrated);
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const isLoading = useAuthSessionStore((s: AuthSessionState) => s.isLoading);

    if (!hasHydrated || isLoading) {
        return <main>Cargando...</main>;
    }

    if (status !== "authenticated") {
        return <Navigate to={ROUTES.login} replace />;
    }

    return <Outlet />;
};
