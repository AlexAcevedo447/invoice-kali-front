import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useApplication } from "@app/application/useApplication";
import { useAuthSessionStore, type AuthSessionState } from "@app/state/authSessionStore";
import { createIdempotencyKey } from "@app/state/createIdempotencyKey";
import { canManageAssignments, canManageRoles, canReadPermissions, canReadRoles, canReadUsers } from "@app/routing/access";
import type { Permission } from "@modules/auth-context/domain/entities/Permission";
import type { Role } from "@modules/auth-context/domain/entities/Role";
import type { User } from "@modules/auth-context/domain/entities/User";
import type { PermissionId } from "@modules/auth-context/domain/value-objects/PermissionId";
import { toPermissionId } from "@modules/auth-context/domain/value-objects/PermissionId";
import type { RoleId } from "@modules/auth-context/domain/value-objects/RoleId";
import { toRoleId } from "@modules/auth-context/domain/value-objects/RoleId";
import { toUserId } from "@modules/auth-context/domain/value-objects/UserId";
import { FormField } from "@shared/ui/forms/FormField";
import { GenericTable, type TableAction, type TableColumn } from "@shared/ui/table/GenericTable";
import { useGlobalToast } from "@shared/ui/GlobalToastContext";
import { roleSchema } from "../forms/roleForm.schema";
import { permissionLabel } from "../forms/permissionForm.schema";
import { fieldErrors } from "../forms/tenantForm.schema";

const errorMessage = (error: unknown) =>
    error instanceof Error && error.message ? error.message : "Error inesperado.";

const byName = (a: Role, b: Role) => a.name.localeCompare(b.name, "es");
const byLabel = (a: Permission, b: Permission) => permissionLabel(a).localeCompare(permissionLabel(b), "es");

const SESSION_NOTE =
    "Los cambios de asignación se aplican de inmediato en el servidor; el menú del usuario afectado se actualiza en su próximo inicio de sesión.";

/**
 * Roles de la empresa de la sesión (RF-06) y asignaciones rol↔permiso y
 * usuario↔rol (RF-08). Ver exige roles/read; crear, editar y eliminar,
 * roles/manage; asignar y quitar, rbac/manage. El servidor aplica la misma
 * regla (403) y la de no otorgar más de lo propio; la interfaz solo oculta
 * acciones que el usuario no puede realizar.
 */
export const RolesPage = () => {
    const application = useApplication();
    const { show } = useGlobalToast();
    const accessToken = useAuthSessionStore((s: AuthSessionState) => s.accessToken);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
    // Roles (lectura) o asignaciones (rbac/manage): cada permiso llega a su parte.
    const allowed = canReadRoles(permissions) || canManageAssignments(permissions);
    const canManage = canManageRoles(permissions);
    const canAssign = canManageAssignments(permissions);
    // El servidor permite estas consultas con su permiso de lectura o con rbac/manage
    // (lo necesario para asignar), así que no se exigen permisos ajenos.
    const canListPermissions = canReadPermissions(permissions) || canAssign;
    const canListUsers = canReadUsers(permissions) || canAssign;

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tenantPermissions, setTenantPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [createValues, setCreateValues] = useState({ name: "", description: "" });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [creating, setCreating] = useState(false);

    const [editing, setEditing] = useState<Role | null>(null);
    const [editValues, setEditValues] = useState({ name: "", description: "" });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [savingEdit, setSavingEdit] = useState(false);

    const [pendingDelete, setPendingDelete] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Diálogo "Permisos del rol"
    const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);
    const [rolePermissionIds, setRolePermissionIds] = useState<PermissionId[]>([]);
    const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false);
    const [permissionToAdd, setPermissionToAdd] = useState("");
    const [changingRolePermission, setChangingRolePermission] = useState(false);

    // Sección "Asignar roles a usuario"
    const [selectedUserId, setSelectedUserId] = useState("");
    const [userRoleIds, setUserRoleIds] = useState<RoleId[]>([]);
    const [userRolesLoading, setUserRolesLoading] = useState(false);
    const [roleToAdd, setRoleToAdd] = useState("");
    const [changingUserRole, setChangingUserRole] = useState(false);

    const notifyError = useCallback(
        (summary: string, error: unknown) => show({ severity: "error", summary, detail: errorMessage(error), life: 6000 }),
        [show],
    );

    const loadRoles = useCallback(() => {
        if (!accessToken || !allowed) return;
        application.authContext.roles
            .list({ accessToken })
            .then((list) => setRoles([...list].sort(byName)))
            .catch((error: unknown) => notifyError("No se pudieron cargar los roles", error))
            .finally(() => setLoading(false));
    }, [accessToken, allowed, application, notifyError]);

    useEffect(() => {
        loadRoles();
    }, [loadRoles]);

    // Permisos de la empresa: para mostrar recurso/acción de los permisos de un rol y elegir cuál agregar.
    useEffect(() => {
        if (!accessToken || !allowed || !canListPermissions) return;
        application.authContext.permissions
            .list({ accessToken })
            .then((list) => setTenantPermissions([...list].sort(byLabel)))
            .catch((error: unknown) => notifyError("No se pudieron cargar los permisos", error));
    }, [accessToken, allowed, canListPermissions, application, notifyError]);

    // Usuarios de la empresa de la sesión: solo hacen falta para asignar roles.
    useEffect(() => {
        if (!accessToken || !allowed || !canAssign || !canListUsers) return;
        application.authContext.users
            .list({ accessToken })
            .then((list) =>
                setUsers([...list].sort((a, b) => (a.username || a.email).localeCompare(b.username || b.email, "es"))),
            )
            .catch((error: unknown) => notifyError("No se pudieron cargar los usuarios", error));
    }, [accessToken, allowed, canAssign, canListUsers, application, notifyError]);

    const loadRolePermissions = useCallback(
        (role: Role) => {
            if (!accessToken) return;
            setRolePermissionsLoading(true);
            application.authContext.rbac
                .getRolePermissions({ roleId: role.id }, { accessToken })
                .then(setRolePermissionIds)
                .catch((error: unknown) => notifyError("No se pudieron cargar los permisos del rol", error))
                .finally(() => setRolePermissionsLoading(false));
        },
        [accessToken, application, notifyError],
    );

    const loadUserRoles = useCallback(
        (userId: string) => {
            if (!accessToken || !userId) return;
            setUserRolesLoading(true);
            application.authContext.rbac
                .getUserRoles({ userId: toUserId(userId) }, { accessToken })
                .then(setUserRoleIds)
                .catch((error: unknown) => notifyError("No se pudieron cargar los roles del usuario", error))
                .finally(() => setUserRolesLoading(false));
        },
        [accessToken, application, notifyError],
    );

    const permissionById = useMemo(
        () => new Map(tenantPermissions.map((permission) => [String(permission.id), permission])),
        [tenantPermissions],
    );
    const roleById = useMemo(() => new Map(roles.map((role) => [String(role.id), role])), [roles]);

    if (!allowed) {
        return (
            <section className="p-5" data-cy="roles-access-denied">
                <h1 className="mt-0">Roles</h1>
                <p>Acceso denegado: necesitas el permiso para ver roles (roles/read).</p>
            </section>
        );
    }

    const onCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!accessToken || creating) return;
        const parsed = roleSchema.safeParse(createValues);
        if (!parsed.success) {
            setCreateErrors(fieldErrors(parsed.error));
            return;
        }
        setCreateErrors({});
        setCreating(true);
        try {
            const created = await application.authContext.roles.create(parsed.data, {
                accessToken,
                idempotencyKey: createIdempotencyKey(),
            });
            show({ severity: "success", summary: "Rol creado", detail: `Se creó el rol "${created.name}".`, life: 4000 });
            setCreateValues({ name: "", description: "" });
            loadRoles();
        } catch (error) {
            notifyError("No se pudo crear el rol", error);
        } finally {
            setCreating(false);
        }
    };

    const openEdit = (role: Role) => {
        setEditing(role);
        setEditValues({ name: role.name, description: role.description ?? "" });
        setEditErrors({});
    };

    const onSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!accessToken || !editing || savingEdit) return;
        const parsed = roleSchema.safeParse(editValues);
        if (!parsed.success) {
            setEditErrors(fieldErrors(parsed.error));
            return;
        }
        setEditErrors({});
        setSavingEdit(true);
        try {
            await application.authContext.roles.update(
                { roleId: editing.id, ...parsed.data },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({ severity: "success", summary: "Rol actualizado", detail: "Los cambios se guardaron.", life: 3000 });
            setEditing(null);
            loadRoles();
        } catch (error) {
            notifyError("No se pudo actualizar el rol", error);
        } finally {
            setSavingEdit(false);
        }
    };

    const onConfirmDelete = async () => {
        if (!accessToken || !pendingDelete || deleting) return;
        setDeleting(true);
        try {
            await application.authContext.roles.delete(
                { roleId: pendingDelete.id },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({
                severity: "success",
                summary: "Rol eliminado",
                detail: `Se eliminó el rol "${pendingDelete.name}".`,
                life: 3000,
            });
            if (userRoleIds.includes(pendingDelete.id)) setUserRoleIds((ids) => ids.filter((id) => id !== pendingDelete.id));
            setPendingDelete(null);
            loadRoles();
        } catch (error) {
            notifyError("No se pudo eliminar el rol", error);
        } finally {
            setDeleting(false);
        }
    };

    const openRolePermissions = (role: Role) => {
        setPermissionsRole(role);
        setRolePermissionIds([]);
        setPermissionToAdd("");
        loadRolePermissions(role);
    };

    const onAddRolePermission = async () => {
        if (!accessToken || !permissionsRole || !permissionToAdd || changingRolePermission) return;
        setChangingRolePermission(true);
        try {
            await application.authContext.rbac.assignRolePermission(
                { roleId: permissionsRole.id, permissionId: toPermissionId(permissionToAdd) },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            const added = permissionById.get(permissionToAdd);
            show({
                severity: "success",
                summary: "Permiso asignado",
                detail: `Se agregó ${added ? permissionLabel(added) : "el permiso"} al rol "${permissionsRole.name}".`,
                life: 3000,
            });
            setPermissionToAdd("");
            loadRolePermissions(permissionsRole);
        } catch (error) {
            notifyError("No se pudo asignar el permiso", error);
        } finally {
            setChangingRolePermission(false);
        }
    };

    const onRemoveRolePermission = async (permissionId: PermissionId) => {
        if (!accessToken || !permissionsRole || changingRolePermission) return;
        setChangingRolePermission(true);
        try {
            await application.authContext.rbac.removeRolePermission(
                { roleId: permissionsRole.id, permissionId },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({ severity: "success", summary: "Permiso quitado", detail: "El rol ya no tiene ese permiso.", life: 3000 });
            loadRolePermissions(permissionsRole);
        } catch (error) {
            notifyError("No se pudo quitar el permiso", error);
        } finally {
            setChangingRolePermission(false);
        }
    };

    const onSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        setUserRoleIds([]);
        setRoleToAdd("");
        if (userId) loadUserRoles(userId);
    };

    const onAddUserRole = async () => {
        if (!accessToken || !selectedUserId || !roleToAdd || changingUserRole) return;
        setChangingUserRole(true);
        try {
            await application.authContext.rbac.assignUserRole(
                { userId: toUserId(selectedUserId), roleId: toRoleId(roleToAdd) },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({
                severity: "success",
                summary: "Rol asignado",
                detail: `Se asignó el rol "${roleById.get(roleToAdd)?.name ?? ""}" al usuario.`,
                life: 3000,
            });
            setRoleToAdd("");
            loadUserRoles(selectedUserId);
        } catch (error) {
            notifyError("No se pudo asignar el rol", error);
        } finally {
            setChangingUserRole(false);
        }
    };

    const onRemoveUserRole = async (roleId: RoleId) => {
        if (!accessToken || !selectedUserId || changingUserRole) return;
        setChangingUserRole(true);
        try {
            await application.authContext.rbac.removeUserRole(
                { userId: toUserId(selectedUserId), roleId },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({
                severity: "success",
                summary: "Rol quitado",
                detail: `El usuario ya no tiene el rol "${roleById.get(String(roleId))?.name ?? ""}".`,
                life: 3000,
            });
            loadUserRoles(selectedUserId);
        } catch (error) {
            notifyError("No se pudo quitar el rol", error);
        } finally {
            setChangingUserRole(false);
        }
    };

    const term = search.trim().toLowerCase();
    const visibleRoles = term
        ? roles.filter(
              (role) => role.name.toLowerCase().includes(term) || (role.description ?? "").toLowerCase().includes(term),
          )
        : roles;

    const columns: TableColumn<Role>[] = [
        { field: "name", header: "Rol", sortable: true, body: (row) => <span data-cy="role-name">{row.name}</span> },
        {
            field: "description",
            header: "Descripción",
            body: (row) => (
                <span data-cy="role-description" className={row.description ? "" : "text-color-secondary"}>
                    {row.description || "Sin descripción"}
                </span>
            ),
        },
    ];

    const actions: TableAction<Role>[] = [
        { label: "Permisos del rol", icon: "pi pi-key", onClick: openRolePermissions, cy: "role-permissions" },
        ...(canManage
            ? [
                  { label: "Editar", icon: "pi pi-pencil", onClick: openEdit, cy: "role-edit" },
                  {
                      label: "Eliminar",
                      icon: "pi pi-trash",
                      severity: "danger" as const,
                      onClick: (role: Role) => setPendingDelete(role),
                      cy: "role-delete",
                  },
              ]
            : []),
    ];

    const assignablePermissions = tenantPermissions.filter((permission) => !rolePermissionIds.includes(permission.id));
    const assignableRoles = roles.filter((role) => !userRoleIds.includes(role.id));
    const selectedUser = users.find((user) => String(user.id) === selectedUserId);

    return (
        <section className="p-5" data-cy="roles-page">
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }} className="mb-4">
                Roles
            </h1>

            {canManage ? (
                <section className="surface-card p-4 border-round border-1 border-300 mb-4">
                    <h3 className="mt-0 mb-3">Nuevo rol</h3>
                    <form onSubmit={onCreate} noValidate className="grid">
                        <div className="col-12 md:col-4">
                            <FormField id="role-create-name" label="Nombre" required error={createErrors.name}>
                                <input
                                    id="role-create-name"
                                    data-cy="role-create-name"
                                    className="p-inputtext p-component w-full"
                                    value={createValues.name}
                                    onChange={(e) => setCreateValues((v) => ({ ...v, name: e.target.value }))}
                                />
                            </FormField>
                        </div>
                        <div className="col-12 md:col-6">
                            <FormField
                                id="role-create-description"
                                label="Descripción (opcional)"
                                error={createErrors.description}
                            >
                                <input
                                    id="role-create-description"
                                    data-cy="role-create-description"
                                    className="p-inputtext p-component w-full"
                                    value={createValues.description}
                                    onChange={(e) => setCreateValues((v) => ({ ...v, description: e.target.value }))}
                                />
                            </FormField>
                        </div>
                        <div className="col-12">
                            <button
                                type="submit"
                                className="p-button p-component"
                                disabled={creating}
                                data-cy="role-create-submit"
                            >
                                {creating ? "Creando..." : "Crear rol"}
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <p data-cy="roles-read-only" className="text-color-secondary mt-0">
                    Solo lectura: no tienes permiso para crear, editar ni eliminar roles.
                </p>
            )}

            <div className="mb-3">
                <input
                    type="search"
                    data-cy="roles-search"
                    className="p-inputtext p-component w-full md:w-6"
                    placeholder="Buscar por nombre o descripción"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div data-cy="roles-table" className="surface-card border-round border-1 border-surface-200 mb-5">
                <GenericTable<Role>
                    data={visibleRoles}
                    columns={columns}
                    actions={actions}
                    loading={loading}
                    emptyMessage="No hay roles registrados."
                    rowKey="id"
                />
            </div>

            {canAssign ? (
                <section className="surface-card p-4 border-round border-1 border-300" data-cy="user-roles-section">
                    <h3 className="mt-0 mb-2">Asignar roles a usuario</h3>
                    <p className="mt-0 text-color-secondary text-sm">{SESSION_NOTE}</p>
                    {canListUsers ? null : (
                        <p className="mt-0 text-color-secondary text-sm" data-cy="user-roles-no-users-permission">
                            Para elegir un usuario necesitas también ver los usuarios de la empresa (users/read).
                        </p>
                    )}
                    <FormField id="user-roles-user-select" label="Usuario">
                        <select
                            id="user-roles-user-select"
                            data-cy="user-roles-user-select"
                            className="p-inputtext p-component w-full md:w-6"
                            value={selectedUserId}
                            onChange={(e) => onSelectUser(e.target.value)}
                        >
                            <option value="">Selecciona un usuario</option>
                            {users.map((user) => (
                                <option key={String(user.id)} value={String(user.id)}>
                                    {user.username ? `${user.username} (${user.email})` : user.email}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    {selectedUserId ? (
                        <>
                            <h4 className="mb-2">Roles de {selectedUser?.username || selectedUser?.email || "el usuario"}</h4>
                            <ul data-cy="user-roles-list" className="list-none p-0 m-0 mb-3">
                                {userRolesLoading ? (
                                    <li className="text-color-secondary">Cargando roles...</li>
                                ) : userRoleIds.length === 0 ? (
                                    <li className="text-color-secondary" data-cy="user-roles-empty">
                                        El usuario no tiene roles asignados.
                                    </li>
                                ) : (
                                    userRoleIds.map((roleId) => (
                                        <li
                                            key={String(roleId)}
                                            data-cy="user-role-item"
                                            className="flex align-items-center justify-content-between gap-2 py-2 border-bottom-1 surface-border"
                                        >
                                            <span data-cy="user-role-name">
                                                {roleById.get(String(roleId))?.name ?? String(roleId)}
                                            </span>
                                            <Button
                                                icon="pi pi-times"
                                                rounded
                                                outlined
                                                severity="danger"
                                                title="Quitar rol"
                                                aria-label="Quitar rol"
                                                disabled={changingUserRole}
                                                onClick={() => onRemoveUserRole(roleId)}
                                                data-cy="user-role-remove"
                                            />
                                        </li>
                                    ))
                                )}
                            </ul>
                            <div className="flex flex-wrap gap-2 align-items-center">
                                <select
                                    aria-label="Rol a asignar"
                                    data-cy="user-role-add-select"
                                    className="p-inputtext p-component w-full md:w-4"
                                    value={roleToAdd}
                                    onChange={(e) => setRoleToAdd(e.target.value)}
                                >
                                    <option value="">
                                        {assignableRoles.length === 0 ? "No hay más roles para asignar" : "Selecciona un rol"}
                                    </option>
                                    {assignableRoles.map((role) => (
                                        <option key={String(role.id)} value={String(role.id)}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    label="Asignar rol"
                                    icon="pi pi-plus"
                                    disabled={!roleToAdd}
                                    loading={changingUserRole}
                                    onClick={onAddUserRole}
                                    data-cy="user-role-add-submit"
                                />
                            </div>
                        </>
                    ) : null}
                </section>
            ) : null}

            <Dialog
                visible={editing !== null}
                onHide={() => setEditing(null)}
                header="Editar rol"
                modal
                style={{ width: "90vw", maxWidth: "460px" }}
            >
                <form onSubmit={onSaveEdit} noValidate data-cy="role-edit-dialog">
                    <FormField id="role-edit-name" label="Nombre" required error={editErrors.name}>
                        <input
                            id="role-edit-name"
                            data-cy="role-edit-name"
                            className="p-inputtext p-component w-full"
                            value={editValues.name}
                            onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        />
                    </FormField>
                    <FormField id="role-edit-description" label="Descripción (opcional)" error={editErrors.description}>
                        <input
                            id="role-edit-description"
                            data-cy="role-edit-description"
                            className="p-inputtext p-component w-full"
                            value={editValues.description}
                            onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
                        />
                    </FormField>
                    <div className="flex gap-2 justify-content-end mt-3">
                        <Button type="button" label="Volver" severity="secondary" onClick={() => setEditing(null)} />
                        <Button type="submit" label="Guardar" loading={savingEdit} data-cy="role-edit-submit" />
                    </div>
                </form>
            </Dialog>

            <Dialog
                visible={pendingDelete !== null}
                onHide={() => setPendingDelete(null)}
                header="Eliminar rol"
                modal
                style={{ width: "90vw", maxWidth: "440px" }}
            >
                <div data-cy="role-delete-dialog">
                    <p>
                        ¿Eliminar el rol <strong>{pendingDelete?.name}</strong>? Si está asignado a usuarios, primero debes
                        quitárselo a cada uno. Sus permisos asignados se desvinculan.
                    </p>
                    <div className="flex gap-2 justify-content-end mt-3">
                        <Button label="Volver" severity="secondary" onClick={() => setPendingDelete(null)} />
                        <Button
                            label="Eliminar"
                            severity="danger"
                            loading={deleting}
                            onClick={onConfirmDelete}
                            data-cy="role-delete-confirm"
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog
                visible={permissionsRole !== null}
                onHide={() => setPermissionsRole(null)}
                header={`Permisos del rol ${permissionsRole?.name ?? ""}`}
                modal
                style={{ width: "90vw", maxWidth: "560px" }}
            >
                <div data-cy="role-permissions-dialog">
                    <ul data-cy="role-permissions-list" className="list-none p-0 m-0 mb-3">
                        {rolePermissionsLoading ? (
                            <li className="text-color-secondary">Cargando permisos...</li>
                        ) : rolePermissionIds.length === 0 ? (
                            <li className="text-color-secondary" data-cy="role-permissions-empty">
                                El rol no tiene permisos asignados.
                            </li>
                        ) : (
                            rolePermissionIds.map((permissionId) => {
                                const permission = permissionById.get(String(permissionId));
                                return (
                                    <li
                                        key={String(permissionId)}
                                        data-cy="role-permission-item"
                                        className="flex align-items-center justify-content-between gap-2 py-2 border-bottom-1 surface-border"
                                    >
                                        <code data-cy="role-permission-label">
                                            {permission ? permissionLabel(permission) : String(permissionId)}
                                        </code>
                                        {canAssign ? (
                                            <Button
                                                icon="pi pi-times"
                                                rounded
                                                outlined
                                                severity="danger"
                                                title="Quitar permiso"
                                                aria-label="Quitar permiso"
                                                disabled={changingRolePermission}
                                                onClick={() => onRemoveRolePermission(permissionId)}
                                                data-cy="role-permission-remove"
                                            />
                                        ) : null}
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    {canAssign && canListPermissions ? (
                        <>
                            <div className="flex flex-wrap gap-2 align-items-center">
                                <select
                                    aria-label="Permiso a agregar"
                                    data-cy="role-permission-add-select"
                                    className="p-inputtext p-component flex-1"
                                    value={permissionToAdd}
                                    onChange={(e) => setPermissionToAdd(e.target.value)}
                                >
                                    <option value="">
                                        {assignablePermissions.length === 0
                                            ? "No hay más permisos para agregar"
                                            : "Selecciona un permiso"}
                                    </option>
                                    {assignablePermissions.map((permission) => (
                                        <option key={String(permission.id)} value={String(permission.id)}>
                                            {permissionLabel(permission)}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    label="Agregar"
                                    icon="pi pi-plus"
                                    disabled={!permissionToAdd}
                                    loading={changingRolePermission}
                                    onClick={onAddRolePermission}
                                    data-cy="role-permission-add-submit"
                                />
                            </div>
                            <p className="text-color-secondary text-sm mb-0">{SESSION_NOTE}</p>
                        </>
                    ) : canAssign ? (
                        <p className="text-color-secondary text-sm mb-0">
                            Para agregar permisos necesitas también ver los permisos de la empresa (permissions/read).
                        </p>
                    ) : null}

                    <div className="flex justify-content-end mt-3">
                        <Button label="Cerrar" severity="secondary" onClick={() => setPermissionsRole(null)} />
                    </div>
                </div>
            </Dialog>
        </section>
    );
};
