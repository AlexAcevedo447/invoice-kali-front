import { Navigate } from "react-router-dom";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { LoginForm } from "../forms/LoginForm";
import { resolveHomeRoute } from "@app/routing/access";

export const LoginPage = () => {
    const hasHydrated = useAuthSessionStore((s: AuthSessionState) => s.hasHydrated);
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const roles = useAuthSessionStore((s: AuthSessionState) => s.roles);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);

    if (!hasHydrated) {
        return <main>Cargando...</main>;
    }

    if (status === "authenticated") {
        const homeRoute = resolveHomeRoute(roles, permissions);
        if (homeRoute) {
            return <Navigate to={homeRoute} replace />;
        }

        return <main>Tu usuario no tiene permisos asignados para ingresar.</main>;
    }

    return (
        <main>
            <LoginForm />
        </main>
    );
};
