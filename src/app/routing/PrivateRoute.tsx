import { Navigate, Outlet } from "react-router-dom";
import { useAuthSessionStore } from "@app/state";
import { ROUTES } from "./routes";

export const PrivateRoute = () => {
    const hasHydrated = useAuthSessionStore((s) => s.hasHydrated);
    const status = useAuthSessionStore((s) => s.status);
    const isLoading = useAuthSessionStore((s) => s.isLoading);

    if (!hasHydrated || isLoading) {
        return <main>Cargando...</main>;
    }

    if (status !== "authenticated") {
        return <Navigate to={ROUTES.login} replace />;
    }

    return <Outlet />;
};
