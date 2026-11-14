import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useApplication } from "@app/application/useApplication";
import { useAuthSessionStore, type AuthSessionState } from "@app/state/authSessionStore";
import { createIdempotencyKey } from "@app/state/createIdempotencyKey";
import {
    canManageAssignments,
    canManageUsers,
    canReadPermissions,
    canReadRoles,
    canReadUsers,
} from "@app/routing/access";
import type { User } from "@modules/auth-context/domain/entities/User";
import { FormField } from "@shared/ui/forms/FormField";
import { GenericTable, type TableAction, type TableColumn } from "@shared/ui/table/GenericTable";
import { useGlobalToast } from "@shared/ui/GlobalToastContext";
import { UserCreateForm } from "../forms/UserCreateForm";
import { EDIT_PASSWORD_HINT, editUserSchema } from "../forms/userForm.schema";
import { fieldErrors } from "../forms/tenantForm.schema";

const errorMessage = (error: unknown) =>
    error instanceof Error && error.message ? error.message : "Error inesperado.";

const byUsername = (a: User, b: User) => (a.username || a.email).localeCompare(b.username || b.email, "es");

const EMPTY_EDIT = { identificationNumber: "", username: "", email: "", password: "" };

const SESSION_NOTE =
    "Los cambios se aplican de inmediato en el servidor; el menú del usuario afectado se actualiza en su próximo inicio de sesión.";

/**
 * Usuarios de la empresa de la sesión (RF-04). Ver exige users/read; crear,
 * editar y eliminar, users/manage; asignar rol al crear, rbac/manage. El
 * servidor aplica las mismas reglas (403), además de no poder editar ni
 * eliminar a alguien con más privilegios, no dejar a la empresa sin
 * administrador y no eliminar a un usuario con roles (409). La interfaz solo
 * oculta lo que el usuario no puede hacer. Nunca se muestra la contraseña.
 */
export const UsersPage = () => {
    const application = useApplication();
    const { show } = useGlobalToast();
    const accessToken = useAuthSessionStore((s: AuthSessionState) => s.accessToken);
    // Nadie se elimina a sí mismo desde este módulo (D3-04); otro administrador sí puede.
    const ownUserId = useAuthSessionStore((s: AuthSessionState) => s.userId);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
    const allowed = canReadUsers(permissions);
    const canManage = canManageUsers(permissions);
    const canAssignRoles =
        canManageAssignments(permissions) && canReadRoles(permissions) && canReadPermissions(permissions);

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [editing, setEditing] = useState<User | null>(null);
    const [editValues, setEditValues] = useState(EMPTY_EDIT);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [savingEdit, setSavingEdit] = useState(false);

    const [pendingDelete, setPendingDelete] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

    const notifyError = useCallback(
        (summary: string, error: unknown) => show({ severity: "error", summary, detail: errorMessage(error), life: 7000 }),
        [show],
    );

    const loadUsers = useCallback(() => {
        if (!accessToken || !allowed) return;
        application.authContext.users
            .list({ accessToken })
            .then((list) => setUsers([...list].sort(byUsername)))
            .catch((error: unknown) => notifyError("No se pudieron cargar los usuarios", error))
            .finally(() => setLoading(false));
    }, [accessToken, allowed, application, notifyError]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    if (!allowed) {
        return (
            <section className="p-5" data-cy="users-access-denied">
                <h1 className="mt-0">Usuarios</h1>
                <p>Acceso denegado: necesitas el permiso para ver usuarios (users/read).</p>
            </section>
        );
    }

    const openEdit = (user: User) => {
        setEditing(user);
        setEditValues({
            identificationNumber: user.identificationNumber,
            username: user.username,
            email: user.email,
            password: "",
        });
        setEditErrors({});
    };

    const onSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!accessToken || !editing || savingEdit) return;
        const parsed = editUserSchema.safeParse(editValues);
        if (!parsed.success) {
            setEditErrors(fieldErrors(parsed.error));
            return;
        }
        setEditErrors({});
        setSavingEdit(true);
        try {
            await application.authContext.users.update(
                { userId: editing.id, ...parsed.data },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({
                severity: "success",
                summary: "Usuario actualizado",
                detail: parsed.data.password
                    ? "Los cambios y la nueva contraseña se guardaron."
                    : "Los cambios se guardaron; la contraseña no cambió.",
                life: 4000,
            });
            setEditing(null);
            loadUsers();
        } catch (error) {
            notifyError("No se pudo actualizar el usuario", error);
        } finally {
            setSavingEdit(false);
        }
    };

    const onConfirmDelete = async () => {
        if (!accessToken || !pendingDelete || deleting) return;
        setDeleting(true);
        try {
            await application.authContext.users.delete(
                { userId: pendingDelete.id },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({
                severity: "success",
                summary: "Usuario eliminado",
                detail: `Se eliminó a "${pendingDelete.username || pendingDelete.email}". Sus sesiones dejan de ser válidas.`,
                life: 4000,
            });
            setPendingDelete(null);
            loadUsers();
        } catch (error) {
            // El diálogo queda abierto para que el usuario lea el motivo y decida.
            notifyError("No se pudo eliminar el usuario", error);
        } finally {
            setDeleting(false);
        }
    };

    const term = search.trim().toLowerCase();
    const visibleUsers = term
        ? users.filter((user) =>
              [user.identificationNumber, user.username, user.email].some((value) =>
                  (value ?? "").toLowerCase().includes(term),
              ),
          )
        : users;

    // Las celdas usan user-row-*: user-identification/user-username/user-email ya
    // identifican los campos del formulario de creación (pruebas Cypress GA10/CP-E2E-007).
    const columns: TableColumn<User>[] = [
        {
            field: "identificationNumber",
            header: "Identificación",
            sortable: true,
            body: (row) => <span data-cy="user-row-identification">{row.identificationNumber}</span>,
        },
        {
            field: "username",
            header: "Usuario",
            sortable: true,
            body: (row) => <span data-cy="user-row-username">{row.username}</span>,
        },
        {
            field: "email",
            header: "Correo",
            sortable: true,
            body: (row) => <span data-cy="user-row-email">{row.email}</span>,
        },
    ];

    const actions: TableAction<User>[] = canManage
        ? [
              { label: "Editar", icon: "pi pi-pencil", onClick: openEdit, cy: "user-edit" },
              {
                  label: "Eliminar",
                  icon: "pi pi-trash",
                  severity: "danger",
                  onClick: (user: User) => setPendingDelete(user),
                  disabled: (user: User) => String(user.id) === ownUserId,
                  tooltip: (user: User) =>
                      String(user.id) === ownUserId ? "No puedes eliminar tu propio usuario" : "Eliminar",
                  cy: "user-delete",
              },
          ]
        : [];

    const setEditField = (field: keyof typeof EMPTY_EDIT) => (value: string) =>
        setEditValues((current) => ({ ...current, [field]: value }));

    return (
        <section className="p-5" data-cy="users-page">
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }} className="mb-2">
                Usuarios
            </h1>
            <p className="mt-0 mb-4 text-color-secondary text-sm" data-cy="users-session-note">
                {SESSION_NOTE}
            </p>

            {canManage ? (
                <UserCreateForm canAssignRoles={canAssignRoles} onCreated={loadUsers} />
            ) : (
                <p data-cy="users-read-only" className="text-color-secondary mt-0">
                    Solo lectura: no tienes permiso para crear, editar ni eliminar usuarios (users/manage).
                </p>
            )}

            <div className="mb-3">
                <input
                    type="search"
                    data-cy="users-search"
                    aria-label="Buscar usuarios"
                    className="p-inputtext p-component w-full md:w-6"
                    placeholder="Buscar por identificación, usuario o correo"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div data-cy="users-table" className="surface-card border-round border-1 border-surface-200">
                <GenericTable<User>
                    data={visibleUsers}
                    columns={columns}
                    actions={actions}
                    loading={loading}
                    emptyMessage={term ? "Ningún usuario coincide con la búsqueda." : "No hay usuarios registrados."}
                    rowKey="id"
                />
            </div>

            <Dialog
                visible={editing !== null}
                onHide={() => setEditing(null)}
                header="Editar usuario"
                modal
                style={{ width: "90vw", maxWidth: "480px" }}
            >
                <form onSubmit={onSaveEdit} noValidate data-cy="user-edit-dialog">
                    <FormField
                        id="user-edit-identification"
                        label="Identificación"
                        required
                        error={editErrors.identificationNumber}
                    >
                        <input
                            id="user-edit-identification"
                            data-cy="user-edit-identification"
                            className="p-inputtext p-component w-full"
                            value={editValues.identificationNumber}
                            onChange={(e) => setEditField("identificationNumber")(e.target.value)}
                        />
                    </FormField>
                    <FormField id="user-edit-username" label="Nombre de usuario" required error={editErrors.username}>
                        <input
                            id="user-edit-username"
                            data-cy="user-edit-username"
                            className="p-inputtext p-component w-full"
                            value={editValues.username}
                            onChange={(e) => setEditField("username")(e.target.value)}
                        />
                    </FormField>
                    <FormField id="user-edit-email" label="Correo" required error={editErrors.email}>
                        <input
                            id="user-edit-email"
                            type="email"
                            data-cy="user-edit-email"
                            className="p-inputtext p-component w-full"
                            autoComplete="off"
                            value={editValues.email}
                            onChange={(e) => setEditField("email")(e.target.value)}
                        />
                    </FormField>
                    <FormField
                        id="user-edit-password"
                        label="Nueva contraseña (opcional)"
                        hint={EDIT_PASSWORD_HINT}
                        error={editErrors.password}
                    >
                        <input
                            id="user-edit-password"
                            type="password"
                            data-cy="user-edit-password"
                            className="p-inputtext p-component w-full"
                            autoComplete="new-password"
                            value={editValues.password}
                            onChange={(e) => setEditField("password")(e.target.value)}
                        />
                    </FormField>
                    <p className="text-color-secondary text-sm mt-0">
                        No puedes editar a un usuario con permisos que tú no tienes.
                    </p>
                    <div className="flex gap-2 justify-content-end mt-3">
                        <Button type="button" label="Volver" severity="secondary" onClick={() => setEditing(null)} />
                        <Button type="submit" label="Guardar" loading={savingEdit} data-cy="user-edit-submit" />
                    </div>
                </form>
            </Dialog>

            <Dialog
                visible={pendingDelete !== null}
                onHide={() => setPendingDelete(null)}
                header="Eliminar usuario"
                modal
                style={{ width: "90vw", maxWidth: "460px" }}
            >
                <div data-cy="user-delete-dialog">
                    <p className="mt-0">
                        ¿Eliminar a <strong>{pendingDelete?.username || pendingDelete?.email}</strong> (
                        {pendingDelete?.email})? Perderá el acceso de inmediato.
                    </p>
                    <p className="text-color-secondary text-sm">
                        Si el usuario tiene roles asignados, primero debes quitárselos en Roles → "Asignar roles a
                        usuario". No se puede eliminar al último administrador de la empresa ni a un usuario con
                        permisos que tú no tienes.
                    </p>
                    <div className="flex gap-2 justify-content-end mt-3">
                        <Button label="Volver" severity="secondary" onClick={() => setPendingDelete(null)} />
                        <Button
                            label="Eliminar"
                            severity="danger"
                            loading={deleting}
                            onClick={onConfirmDelete}
                            data-cy="user-delete-confirm"
                        />
                    </div>
                </div>
            </Dialog>
        </section>
    );
};
