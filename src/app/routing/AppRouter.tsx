import { Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import { useAuthSessionStore } from "../state/authSessionStore";
import type { AuthSessionState } from "../state/authSessionStore";
import {
    resolveHomeRoute,
} from "./access";

export const HomeRedirect = () => {
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const isLoading = useAuthSessionStore((s: AuthSessionState) => s.isLoading);
    const roles = useAuthSessionStore((s: AuthSessionState) => s.roles);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);

    if (isLoading) {
        return <main>Cargando...</main>;
    }

    if (status !== "authenticated") {
        return <Navigate to={ROUTES.login} replace />;
    }

    const homeRoute = resolveHomeRoute(roles, permissions);
    if (homeRoute) {
        return <Navigate to={homeRoute} replace />;
    }

    return <main>Tu usuario no tiene permisos asignados para acceder a módulos.</main>;
};
