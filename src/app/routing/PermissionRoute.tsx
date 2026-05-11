import { Navigate, Outlet } from "react-router-dom";
import { useAuthSessionStore } from "../state/authSessionStore";
import type { AuthSessionState } from "../state/authSessionStore";
import { ROUTES } from "./routes";
import type { AuthSession } from "@modules/auth-context/domain/entities";

interface PermissionRouteProps {
    canAccess: (roles: string[], permissions: AuthSession["permissions"]) => boolean;
    deniedMessage?: string;
}

export const PermissionRoute = ({ canAccess, deniedMessage }: PermissionRouteProps) => {
    const isLoading = useAuthSessionStore((s: AuthSessionState) => s.isLoading);
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const roles = useAuthSessionStore((s: AuthSessionState) => s.roles);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);

    if (isLoading) {
        return <main>Cargando...</main>;
    }

    if (status !== "authenticated") {
        return <Navigate to={ROUTES.login} replace />;
    }

    if (!canAccess(roles, permissions)) {
        return <main>{deniedMessage ?? "Tu usuario no tiene permisos para esta sección."}</main>;
    }

    return <Outlet />;
};
