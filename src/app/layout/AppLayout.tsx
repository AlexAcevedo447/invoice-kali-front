import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { getSessionExpiry, useAuthSessionStore } from "../state/authSessionStore";
import type { AuthSessionState } from "../state/authSessionStore";
import { useInvoicingStore } from "../state/invoicingStore";
import { ROUTES } from "../routing/routes";
import {
    canManageTenants,
    canReadCustomers,
    canReadInvoices,
    canReadPermissions,
    canReadProducts,
    canReadRoles,
    canManageAssignments,
    canReadUsers,
} from "../routing/access";

/**
 * Barra superior de la zona autenticada. Solo enlaza módulos con funcionalidad
 * real y solo si los permisos efectivos de la sesión permiten verlos
 * (Facturas: invoices/read; Clientes: customers/read; Productos: products/read;
 * Usuarios: users/read; Roles: roles/read; Permisos: permissions/read;
 * Empresas: tenants/manage en la empresa de plataforma). El nombre del rol no
 * cuenta. Los permisos se leen al iniciar sesión.
 */
export const AppLayout = () => {
    const navigate = useNavigate();
    const email = useAuthSessionStore((s: AuthSessionState) => s.email);
    const tenantName = useAuthSessionStore((s: AuthSessionState) => s.tenantName);
    const isPlatformTenant = useAuthSessionStore((s: AuthSessionState) => s.isPlatformTenant);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
    const logout = useAuthSessionStore((s: AuthSessionState) => s.actions.logout);
    const expireSession = useAuthSessionStore((s: AuthSessionState) => s.actions.expireSession);
    const expiresAt = useAuthSessionStore((s: AuthSessionState) => s.expiresAt);
    const accessToken = useAuthSessionStore((s: AuthSessionState) => s.accessToken);

    // Cierra la sesión automáticamente cuando vence el token (sin refresh token).
    useEffect(() => {
        const expiry = getSessionExpiry({ expiresAt, accessToken });
        if (expiry === null) return;
        const MAX_TIMEOUT_MS = 2_147_483_647;
        const timer = window.setTimeout(
            expireSession,
            Math.min(Math.max(expiry - Date.now(), 0), MAX_TIMEOUT_MS)
        );
        return () => window.clearTimeout(timer);
    }, [expiresAt, accessToken, expireSession]);

    const links: Array<{ to: string; label: string; cy: string }> = [];
    if (canReadInvoices(permissions)) {
        links.push({ to: ROUTES.invoicing.invoices, label: "Facturas", cy: "nav-invoices" });
    }
    if (canReadCustomers(permissions)) {
        links.push({ to: ROUTES.invoicing.customers, label: "Clientes", cy: "nav-customers" });
    }
    if (canReadProducts(permissions)) {
        links.push({ to: ROUTES.invoicing.products, label: "Productos", cy: "nav-products" });
    }
    if (canReadUsers(permissions)) {
        links.push({ to: ROUTES.admin.users, label: "Usuarios", cy: "nav-users" });
    }
    // rbac/manage llega a las asignaciones (en Roles) sin exigir roles/read.
    if (canReadRoles(permissions) || canManageAssignments(permissions)) {
        links.push({ to: ROUTES.admin.roles, label: "Roles", cy: "nav-roles" });
    }
    if (canReadPermissions(permissions)) {
        links.push({ to: ROUTES.admin.permissions, label: "Permisos", cy: "nav-permissions" });
    }
    if (canManageTenants(isPlatformTenant, permissions)) {
        links.push({ to: ROUTES.admin.tenants, label: "Empresas", cy: "nav-tenants" });
    }

    const handleLogout = () => {
        logout();
        useInvoicingStore.getState().actions.reset();
        navigate(ROUTES.login, { replace: true });
    };

    return (
        <>
            {/* En pantallas angostas marca, empresa, enlaces y sesión pasan a otra línea
                (flex-wrap en src/app/styles/global.css): la página no se desplaza en horizontal. */}
            <header data-cy="app-header" className="app-header border-bottom-1 surface-border surface-0">
                <div className="app-header__main">
                    <span className="app-header__brand font-bold text-xl">Invoice Kali</span>
                    {tenantName ? (
                        <span data-cy="session-tenant" className="app-header__tenant text-color-secondary">
                            {tenantName}
                        </span>
                    ) : null}
                    <nav data-cy="app-nav" className="app-header__nav">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                data-cy={link.cy}
                                className={({ isActive }) =>
                                    `p-button p-button-text p-button-sm no-underline${isActive ? " font-bold" : ""}`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="app-header__session">
                    {email ? (
                        <span data-cy="session-email" className="app-header__email text-color-secondary text-sm">
                            {email}
                        </span>
                    ) : null}
                    <Button
                        data-cy="logout-button"
                        label="Cerrar sesión"
                        icon="pi pi-sign-out"
                        severity="secondary"
                        outlined
                        size="small"
                        onClick={handleLogout}
                    />
                </div>
            </header>
            <Outlet />
        </>
    );
};
