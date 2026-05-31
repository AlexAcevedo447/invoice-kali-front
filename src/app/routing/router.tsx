import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { PermissionRoute } from "./PermissionRoute";
import { ROUTES } from "./routes";
import {
    canAccessAdminModule,
    canAccessInvoicingModule,
} from "./access";
import { HomeRedirect } from "./AppRouter";

const moduleRoutes: RouteObject[] = [
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