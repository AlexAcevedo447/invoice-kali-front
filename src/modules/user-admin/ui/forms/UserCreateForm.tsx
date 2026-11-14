import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { useApplication } from "../../../../app/application/useApplication";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { createIdempotencyKey } from "../../../../app/state/createIdempotencyKey";
import { toTenantId } from "../../../auth-context/domain/value-objects/TenantId";
import { toUserId } from "../../../auth-context/domain/value-objects/UserId";
import { toRoleId } from "../../../auth-context/domain/value-objects/RoleId";
import { HttpError } from "../../../../shared/application/http/HttpError";
import { FormActions } from "../../../../shared/ui/forms/FormActions";
import { FormField } from "../../../../shared/ui/forms/FormField";
import { SubmitButton } from "../../../../shared/ui/forms/SubmitButton";
import { useZodForm } from "../../../../shared/ui/forms/useZodForm";
import { useGlobalToast } from "../../../../shared/ui/GlobalToastContext";
import type { Role } from "../../../auth-context/domain/entities/Role";

const userSchema = z.object({
    identificationNumber: z.string().min(1, "Identification number is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
    roleId: z.string().min(1, "Role is required"),
});

const errorMessage = (error: unknown): string =>
    error instanceof Error && error.message ? error.message : "Error inesperado.";

type UserFormValues = z.infer<typeof userSchema>;

export const UserCreateForm = () => {
    const isSubmittingRef = useRef(false);
    const { show } = useGlobalToast();
    const application = useApplication();
    const accessToken = useAuthSessionStore((state: AuthSessionState) => state.accessToken);
    const tenantId = useAuthSessionStore((state: AuthSessionState) => state.tenantId);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesLoaded, setRolesLoaded] = useState(false);

    // Roles disponibles en el tenant (GET /api/v1/roles), filtrados a los que tienen
    // al menos un permiso (GET /api/v1/rbac/roles/permissions): un rol sin permisos
    // dejaría al usuario sin acceso. No se asigna ningún rol por defecto.
    useEffect(() => {
        if (!accessToken || !tenantId) return;
        let cancelled = false;
        application.authContext.roles
            .list({ accessToken })
            .then((allRoles) =>
                Promise.all(
                    allRoles.map(async (role) => {
                        const links = await application.authContext.rbac.getRolePermissions(
                            { roleId: role.id },
                            { accessToken }
                        );
                        return links.length > 0 ? role : null;
                    })
                )
            )
            .then((result) => {
                if (!cancelled) setRoles(result.filter((role): role is Role => role !== null));
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                show({
                    severity: "error",
                    summary: "No se pudieron cargar los roles",
                    detail: errorMessage(error),
                    life: 4000,
                });
            })
            .finally(() => {
                if (!cancelled) setRolesLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, [application, accessToken, tenantId, show]);

    const form = useZodForm<UserFormValues>(userSchema, {
        defaultValues: {
            identificationNumber: "",
            username: "",
            email: "",
            password: "",
            roleId: "",
        },
    });

    const submitValues = async (values: UserFormValues) => {
        if (!accessToken || !tenantId) return;

        try {
            await application.authContext.users.create(
                {
                    tenantId: toTenantId(tenantId),
                    identificationNumber: values.identificationNumber,
                    username: values.username,
                    email: values.email,
                    password: values.password,
                },
                {
                    accessToken,
                    idempotencyKey: createIdempotencyKey(),
                }
            );
        } catch (error) {
            if (error instanceof HttpError && error.status === 409) {
                show({
                    severity: "error",
                    summary: "Email duplicado",
                    detail: "Ya existe un usuario registrado con este correo electrónico.",
                    life: 4000,
                });
            } else {
                show({
                    severity: "error",
                    summary: "Error al crear usuario",
                    detail: errorMessage(error),
                    life: 5000,
                });
            }
            return;
        }

        // POST /users no devuelve el id: se consulta por correo y se asigna el rol elegido.
        try {
            const user = await application.authContext.users.getByEmail(
                { tenantId: toTenantId(tenantId), email: values.email },
                { accessToken }
            );
            await application.authContext.rbac.assignUserRole(
                {
                    userId: toUserId(String(user.id)),
                    roleId: toRoleId(values.roleId),
                },
                { accessToken, idempotencyKey: createIdempotencyKey() }
            );

            const roleName = roles.find((role) => String(role.id) === values.roleId)?.name;
            show({
                severity: "success",
                summary: "Usuario creado",
                detail: roleName
                    ? `El usuario se creó correctamente con el rol "${roleName}".`
                    : "El usuario se creó correctamente.",
                life: 4000,
            });
            form.reset();
        } catch (error) {
            show({
                severity: "error",
                summary: "Usuario creado sin rol",
                detail: `El usuario se creó, pero no se pudo asignar el rol: ${errorMessage(error)}`,
                life: 6000,
            });
        }
    };

    // La guarda contra envíos duplicados vive en el manejador del evento (no en
    // render): cubre validación + peticiones y se libera siempre al terminar.
    const onSafeSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await form.handleSubmit(submitValues)();
        } finally {
            isSubmittingRef.current = false;
        }
    };

    return (
        <section className="surface-card p-4 border-round border-1 border-300 mb-4">
            <h3 className="mt-0 mb-3">Crear usuario</h3>
            <form onSubmit={onSafeSubmit} noValidate>
                <FormField
                    id="identificationNumber"
                    label="Identification Number"
                    required
                    error={form.formState.errors.identificationNumber?.message}
                >
                    <input
                        id="identificationNumber"
                        type="text"
                        data-cy="user-identification"
                        className="p-inputtext p-component w-full"
                        {...form.register("identificationNumber")}
                    />
                </FormField>

                <FormField
                    id="username"
                    label="Username"
                    required
                    error={form.formState.errors.username?.message}
                >
                    <input
                        id="username"
                        type="text"
                        data-cy="user-username"
                        className="p-inputtext p-component w-full"
                        {...form.register("username")}
                    />
                </FormField>

                <FormField
                    id="email"
                    label="Email"
                    required
                    error={form.formState.errors.email?.message}
                >
                    <input
                        id="email"
                        type="email"
                        data-cy="user-email"
                        className="p-inputtext p-component w-full"
                        autoComplete="email"
                        {...form.register("email")}
                    />
                </FormField>

                <FormField
                    id="password"
                    label="Password"
                    required
                    hint="Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo, sin espacios."
                    error={form.formState.errors.password?.message}
                >
                    <input
                        id="password"
                        type="password"
                        data-cy="user-password"
                        className="p-inputtext p-component w-full"
                        autoComplete="new-password"
                        {...form.register("password")}
                    />
                </FormField>

                <FormField
                    id="roleId"
                    label="Role"
                    required
                    hint={
                        rolesLoaded && roles.length === 0
                            ? "No hay roles con permisos asignados en este tenant."
                            : undefined
                    }
                    error={form.formState.errors.roleId?.message}
                >
                    <select
                        id="roleId"
                        data-cy="user-role"
                        className="p-inputtext p-component w-full"
                        disabled={!rolesLoaded || roles.length === 0}
                        {...form.register("roleId")}
                    >
                        <option value="">
                            {rolesLoaded ? "Selecciona un rol" : "Cargando roles..."}
                        </option>
                        {roles.map((role) => (
                            <option key={String(role.id)} value={String(role.id)}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormActions>
                    <SubmitButton
                        label="Crear usuario"
                        loadingLabel="Creando..."
                        isSubmitting={form.formState.isSubmitting}
                        data-cy="user-submit"
                    />
                </FormActions>
            </form>
        </section>
    );
};
