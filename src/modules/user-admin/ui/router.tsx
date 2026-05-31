import { lazy, Suspense } from "react";
import { DeferredComponentFallback } from "@shared/ui/fallbacks/DeferredComponentFallback";
import { Navigate, Route, Routes } from "react-router-dom";

const UsersPage = lazy(() => import("./pages/UsersPage").then((m) => ({ default: m.UsersPage })));
const TenantsPage = lazy(() => import("./pages/TenantsPage").then((m) => ({ default: m.TenantsPage })));
const RolesPage = lazy(() => import("./pages/RolesPage").then((m) => ({ default: m.RolesPage })));
const PermissionsPage = lazy(() => import("./pages/PermissionsPage").then((m) => ({ default: m.PermissionsPage })));

export const UserAdminRouter = () => (
    <Suspense fallback={<DeferredComponentFallback />}>
        <Routes>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
        </Routes>
    </Suspense>
);
