import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { getSessionExpiry, useAuthSessionStore } from "../state/authSessionStore";
import type { AuthSessionState } from "../state/authSessionStore";
import { useInvoicingStore } from "../state/invoicingStore";
import { ROUTES } from "../routing/routes";
import { canAccessAdminModule, canAccessInvoicingModule } from "../routing/access";

/**
 * Barra superior de la zona autenticada. Solo enlaza módulos con funcionalidad
 * real (Facturas y Usuarios) y solo si la sesión tiene permiso para verlos.
 */
export const AppLayout = () => {
    const navigate = useNavigate();
    const email = useAuthSessionStore((s: AuthSessionState) => s.email);
    const tenantName = useAuthSessionStore((s: AuthSessionState) => s.tenantName);
    const roles = useAuthSessionStore((s: AuthSessionState) => s.roles);
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
    if (canAccessInvoicingModule(roles, permissions)) {
        links.push({ to: ROUTES.invoicing.invoices, label: "Facturas", cy: "nav-invoices" });
        links.push({ to: ROUTES.invoicing.customers, label: "Clientes", cy: "nav-customers" });
        links.push({ to: ROUTES.invoicing.products, label: "Productos", cy: "nav-products" });
    }
    if (canAccessAdminModule(roles, permissions)) {
        links.push({ to: ROUTES.admin.users, label: "Usuarios", cy: "nav-users" });
    }

    const handleLogout = () => {
        logout();
        useInvoicingStore.getState().actions.reset();
        navigate(ROUTES.login, { replace: true });
    };

    return (
        <>
            <header
                data-cy="app-header"
                className="flex align-items-center justify-content-between px-5 py-3 border-bottom-1 surface-border surface-0"
            >
                <div className="flex align-items-center gap-4">
                    <span className="font-bold text-xl">Invoice Kali</span>
                    {tenantName ? (
                        <span data-cy="session-tenant" className="text-color-secondary">
                            {tenantName}
                        </span>
                    ) : null}
                    <nav data-cy="app-nav" className="flex gap-2">
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
                <div className="flex align-items-center gap-3">
                    {email ? (
                        <span data-cy="session-email" className="text-color-secondary text-sm">
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
