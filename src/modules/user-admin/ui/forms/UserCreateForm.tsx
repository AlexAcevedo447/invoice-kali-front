import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useApplication } from "@app/application/useApplication";
import { useAuthSessionStore, type AuthSessionState } from "@app/state/authSessionStore";
import { createIdempotencyKey } from "@app/state/createIdempotencyKey";
import type { Role } from "@modules/auth-context/domain/entities/Role";
import { toRoleId } from "@modules/auth-context/domain/value-objects/RoleId";
import { FormActions } from "@shared/ui/forms/FormActions";
import { FormField } from "@shared/ui/forms/FormField";
import { SubmitButton } from "@shared/ui/forms/SubmitButton";
import { useGlobalToast } from "@shared/ui/GlobalToastContext";
import { assignableRoles } from "./assignableRoles";
import { PASSWORD_POLICY_HINT, createUserSchema } from "./userForm.schema";
import { fieldErrors } from "./tenantForm.schema";

const errorMessage = (error: unknown): string =>
    error instanceof Error && error.message ? error.message : "Error inesperado.";

const EMPTY_VALUES = { identificationNumber: "", username: "", email: "", password: "", roleId: "" };

interface UserCreateFormProps {
    /**
     * Mostrar el rol opcional: la sesión puede asignar roles (rbac/manage) y ver
     * roles y permisos (roles/read, permissions/read) para saber cuáles cubre.
     */
    canAssignRoles: boolean;
    /** Se llama tras crear el usuario (con o sin rol) para recargar la lista. */
    onCreated?: () => void;
}

/**
 * Crear usuario (CA-04.2). La empresa la toma el servidor del token. El rol es
 * opcional y solo se ofrecen los roles cuyos permisos cubre la sesión
 * (CA-04.6); se asigna con el Id que devuelve POST /users.
 */
export const UserCreateForm = ({ canAssignRoles, onCreated }: UserCreateFormProps) => {
    const { show } = useGlobalToast();
    const application = useApplication();
    const accessToken = useAuthSessionStore((state: AuthSessionState) => state.accessToken);
    const sessionPermissions = useAuthSessionStore((state: AuthSessionState) => state.permissions);

    const [values, setValues] = useState(EMPTY_VALUES);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesLoaded, setRolesLoaded] = useState(false);

    // Roles de la empresa (GET /roles) + sus permisos (GET /rbac/roles/permissions)
    // + permisos de la empresa (GET /permissions) para saber cuáles cubre la sesión.
    useEffect(() => {
        if (!accessToken || !canAssignRoles) return;
        let cancelled = false;
        const { roles: roleRepository, rbac, permissions } = application.authContext;
        Promise.all([roleRepository.list({ accessToken }), permissions.list({ accessToken })])
            .then(async ([allRoles, tenantPermissions]) => {
                const links = await Promise.all(
                    allRoles.map(
                        async (role) =>
                            [String(role.id), await rbac.getRolePermissions({ roleId: role.id }, { accessToken })] as const,
                    ),
                );
                return assignableRoles(
                    allRoles,
                    new Map(links),
                    new Map(tenantPermissions.map((permission) => [String(permission.id), permission])),
                    sessionPermissions,
                ).sort((a, b) => a.name.localeCompare(b.name, "es"));
            })
            .then((result) => {
                if (!cancelled) setRoles(result);
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                show({ severity: "error", summary: "No se pudieron cargar los roles", detail: errorMessage(error), life: 4000 });
            })
            .finally(() => {
                if (!cancelled) setRolesLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, [application, accessToken, canAssignRoles, sessionPermissions, show]);

    const setField = (field: keyof typeof EMPTY_VALUES) => (value: string) =>
        setValues((current) => ({ ...current, [field]: value }));

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!accessToken || submitting) return;
        const parsed = createUserSchema.safeParse(canAssignRoles ? values : { ...values, roleId: "" });
        if (!parsed.success) {
            setErrors(fieldErrors(parsed.error));
            return;
        }
        setErrors({});
        setSubmitting(true);
        const { roleId, ...command } = parsed.data;
        try {
            let created;
            try {
                created = await application.authContext.users.create(command, {
                    accessToken,
                    idempotencyKey: createIdempotencyKey(),
                });
            } catch (error) {
                show({ severity: "error", summary: "No se pudo crear el usuario", detail: errorMessage(error), life: 6000 });
                return;
            }

            if (!roleId) {
                show({ severity: "success", summary: "Usuario creado", detail: "El usuario se creó correctamente.", life: 4000 });
            } else {
                try {
                    await application.authContext.rbac.assignUserRole(
                        { userId: created.id, roleId: toRoleId(roleId) },
                        { accessToken, idempotencyKey: createIdempotencyKey() },
                    );
                    const roleName = roles.find((role) => String(role.id) === roleId)?.name;
                    show({
                        severity: "success",
                        summary: "Usuario creado",
                        detail: roleName
                            ? `El usuario se creó correctamente con el rol "${roleName}".`
                            : "El usuario se creó correctamente.",
                        life: 4000,
                    });
                } catch (error) {
                    show({
                        severity: "error",
                        summary: "Usuario creado sin rol",
                        detail: `El usuario se creó, pero no se pudo asignar el rol: ${errorMessage(error)}`,
                        life: 6000,
                    });
                }
            }
            setValues(EMPTY_VALUES);
            onCreated?.();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="surface-card p-4 border-round border-1 border-300 mb-4" data-cy="user-create-form">
            <h3 className="mt-0 mb-3">Crear usuario</h3>
            <form onSubmit={onSubmit} noValidate>
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <FormField id="identificationNumber" label="Identificación" required error={errors.identificationNumber}>
                            <input
                                id="identificationNumber"
                                type="text"
                                data-cy="user-identification"
                                className="p-inputtext p-component w-full"
                                value={values.identificationNumber}
                                onChange={(e) => setField("identificationNumber")(e.target.value)}
                            />
                        </FormField>
                    </div>
                    <div className="col-12 md:col-6">
                        <FormField id="username" label="Nombre de usuario" required error={errors.username}>
                            <input
                                id="username"
                                type="text"
                                data-cy="user-username"
                                className="p-inputtext p-component w-full"
                                value={values.username}
                                onChange={(e) => setField("username")(e.target.value)}
                            />
                        </FormField>
                    </div>
                    <div className="col-12 md:col-6">
                        <FormField id="email" label="Correo" required error={errors.email}>
                            <input
                                id="email"
                                type="email"
                                data-cy="user-email"
                                className="p-inputtext p-component w-full"
                                autoComplete="off"
                                value={values.email}
                                onChange={(e) => setField("email")(e.target.value)}
                            />
                        </FormField>
                    </div>
                    <div className="col-12 md:col-6">
                        <FormField
                            id="password"
                            label="Contraseña"
                            required
                            hint={PASSWORD_POLICY_HINT}
                            error={errors.password}
                        >
                            <input
                                id="password"
                                type="password"
                                data-cy="user-password"
                                className="p-inputtext p-component w-full"
                                autoComplete="new-password"
                                value={values.password}
                                onChange={(e) => setField("password")(e.target.value)}
                            />
                        </FormField>
                    </div>
                    {canAssignRoles ? (
                        <div className="col-12 md:col-6">
                            <FormField
                                id="roleId"
                                label="Rol (opcional)"
                                hint={
                                    rolesLoaded && roles.length === 0
                                        ? "No hay roles que puedas asignar: deben tener permisos y no superar los tuyos."
                                        : "Solo se listan roles con permisos que tú también tienes."
                                }
                                error={errors.roleId}
                            >
                                <select
                                    id="roleId"
                                    data-cy="user-role"
                                    className="p-inputtext p-component w-full"
                                    disabled={!rolesLoaded || roles.length === 0}
                                    value={values.roleId}
                                    onChange={(e) => setField("roleId")(e.target.value)}
                                >
                                    <option value="">{rolesLoaded ? "Sin rol" : "Cargando roles..."}</option>
                                    {roles.map((role) => (
                                        <option key={String(role.id)} value={String(role.id)}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        </div>
                    ) : null}
                </div>
                {canAssignRoles ? null : (
                    <p className="text-color-secondary text-sm mt-0" data-cy="user-create-no-roles">
                        El usuario se creará sin roles. Para asignarle uno necesitas rbac/manage, roles/read y
                        permissions/read (o pídeselo a un administrador desde Roles).
                    </p>
                )}

                <FormActions>
                    <SubmitButton
                        label="Crear usuario"
                        loadingLabel="Creando..."
                        isSubmitting={submitting}
                        data-cy="user-submit"
                    />
                </FormActions>
            </form>
        </section>
    );
};
