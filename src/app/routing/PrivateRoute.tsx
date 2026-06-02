import { Navigate, Outlet } from "react-router-dom";
import { useAuthSessionStore } from "../state/authSessionStore";
import type { AuthSessionState } from "../state/authSessionStore";
import { ROUTES } from "./routes";
import { MainLayout } from "../../shared/ui/layout/MainLayout";

export const PrivateRoute = () => {
    const hasHydrated = useAuthSessionStore((s: AuthSessionState) => s.hasHydrated);
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const isLoading = useAuthSessionStore((s: AuthSessionState) => s.isLoading);

    if (!hasHydrated || isLoading) {
        return <main className="flex align-items-center justify-content-center min-h-screen"><i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i></main>;
    }

    if (status !== "authenticated") {
        return <Navigate to={ROUTES.login} replace />;
    }

    return (
        <MainLayout>
            <Outlet />
        </MainLayout>
    );
};

