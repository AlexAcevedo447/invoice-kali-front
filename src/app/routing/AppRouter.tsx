import { createBrowserRouter, Navigate } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { PermissionRoute } from "./PermissionRoute";
import { ROUTES } from "./routes";
import { useAuthSessionStore } from "@app/state";
import {
    canAccessAdminModule,
    canAccessInvoicingModule,
    resolveHomeRoute,
} from "./access";

const HomeRedirect = () => {
    const status = useAuthSessionStore((s) => s.status);
    const isLoading = useAuthSessionStore((s) => s.isLoading);
    const roles = useAuthSessionStore((s) => s.roles);
    const permissions = useAuthSessionStore((s) => s.permissions);

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

const moduleRoutes = [
    {
        // Requiere rol "admin" o permisos de administración.
        Component: () => <PermissionRoute canAccess={canAccessAdminModule} />,
        children: [
            {
                path: "admin/*",
                lazy: () =>
                    import("@modules/user-admin/ui/router").then((m) => ({
                        Component: m.UserAdminRouter,
                    })),
            },
        ],
    },
    {
        // Requiere rol "invoicing" o permisos de facturación.
        Component: () => <PermissionRoute canAccess={canAccessInvoicingModule} />,
        children: [
            {
                path: "invoicing/*",
                lazy: () =>
                    import("@modules/invoicing/ui/router").then((m) => ({
                        Component: m.InvoicingRouter,
                    })),
            },
        ],
    },
];

export const router = createBrowserRouter([
    {
        path: ROUTES.login,
        lazy: () =>
            import("@modules/auth-context/ui/router").then((m) => ({
                Component: m.LoginPage,
            })),
    },
    {
        path: "/",
        Component: PrivateRoute,
        children: [
            {
                index: true,
                element: <HomeRedirect />,
            },
            ...moduleRoutes,
        ],
    },
]);
