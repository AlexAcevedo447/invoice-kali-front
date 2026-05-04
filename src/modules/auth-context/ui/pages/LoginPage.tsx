import { Navigate } from "react-router-dom";
import { useAuthSessionStore } from "@app/state";
import { LoginForm } from "../forms/LoginForm";
import { resolveHomeRoute } from "@app/routing/access";

export const LoginPage = () => {
    const hasHydrated = useAuthSessionStore((s) => s.hasHydrated);
    const status = useAuthSessionStore((s) => s.status);
    const roles = useAuthSessionStore((s) => s.roles);
    const permissions = useAuthSessionStore((s) => s.permissions);

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
