import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { useAuthSessionStore } from "../state/authSessionStore";
import type { AuthSessionState } from "../state/authSessionStore";
import { resolveHomeRoute } from "./access";
import { ROUTES } from "./routes";

/**
 * Sesión válida (credenciales y empresa correctas) sin permisos sobre ningún
 * módulo. No es un error de inicio de sesión: se informa y se permite cerrar
 * sesión. Si la sesión sí tiene algún módulo, se redirige a él (sin bucles:
 * esta ruta no exige permisos y el inicio solo la usa cuando no hay ninguno).
 */
export const NoAccessPage = () => {
    const navigate = useNavigate();
    const roles = useAuthSessionStore((s: AuthSessionState) => s.roles);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
    const isPlatformTenant = useAuthSessionStore((s: AuthSessionState) => s.isPlatformTenant);
    const email = useAuthSessionStore((s: AuthSessionState) => s.email);
    const logout = useAuthSessionStore((s: AuthSessionState) => s.actions.logout);

    const home = resolveHomeRoute(roles, permissions, isPlatformTenant);
    if (home) {
        return <Navigate to={home} replace />;
    }

    return (
        <section className="p-5" data-cy="no-access">
            <h1 className="mt-0">Sin acceso a módulos</h1>
            <p>
                Iniciaste sesión correctamente{email ? <> como <strong>{email}</strong></> : null}, pero tu usuario
                todavía no tiene permisos sobre ningún módulo.
            </p>
            <p>
                Pide a un administrador de tu empresa que te asigne un rol con permisos. Los cambios se aplican al
                volver a iniciar sesión.
            </p>
            <Button
                label="Cerrar sesión"
                icon="pi pi-sign-out"
                severity="secondary"
                data-cy="no-access-logout"
                onClick={() => {
                    logout();
                    navigate(ROUTES.login, { replace: true });
                }}
            />
        </section>
    );
};
