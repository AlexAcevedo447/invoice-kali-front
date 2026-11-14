import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useApplication } from "@app/application/useApplication";
import { useAuthSessionStore, type AuthSessionState } from "@app/state/authSessionStore";
import { createIdempotencyKey } from "@app/state/createIdempotencyKey";
import { canManagePermissions, canReadPermissions } from "@app/routing/access";
import type { Permission } from "@modules/auth-context/domain/entities/Permission";
import type { PermissionCatalog } from "@modules/auth-context/domain/entities/PermissionCatalog";
import { FormField } from "@shared/ui/forms/FormField";
import { GenericTable, type TableAction, type TableColumn } from "@shared/ui/table/GenericTable";
import { useGlobalToast } from "@shared/ui/GlobalToastContext";
import {
    actionOptions,
    createPermissionSchema,
    normalizePermissionPart,
    permissionLabel,
    resourceOptions,
} from "../forms/permissionForm.schema";
import { fieldErrors } from "../forms/tenantForm.schema";

const errorMessage = (error: unknown) =>
    error instanceof Error && error.message ? error.message : "Error inesperado.";

const EMPTY_CATALOG: PermissionCatalog = { resources: [] };
const EMPTY_VALUES = { resource: "", action: "" };

const WILDCARD_HINT =
    '"*" es comodín: como recurso cubre todos los recursos (acción "*", "read" o "manage"); como acción cubre todas las acciones del recurso.';

type PermissionValues = { resource: string; action: string };

interface PermissionFieldsProps {
    prefix: "permission-create" | "permission-edit";
    catalog: PermissionCatalog;
    values: PermissionValues;
    errors: Record<string, string>;
    onChange: (values: PermissionValues) => void;
}

/** Recurso y acción elegidos del catálogo (más "*"); la acción depende del recurso. */
const PermissionFields = ({ prefix, catalog, values, errors, onChange }: PermissionFieldsProps) => {
    const resources = resourceOptions(catalog);
    const actions = values.resource ? actionOptions(catalog, values.resource) : [];
    return (
        <>
            <FormField id={`${prefix}-resource`} label="Recurso" required error={errors.resource}>
                <select
                    id={`${prefix}-resource`}
                    data-cy={`${prefix}-resource`}
                    className="p-inputtext p-component w-full"
                    value={values.resource}
                    onChange={(e) => {
                        const resource = e.target.value;
                        const keepAction = resource && actionOptions(catalog, resource).includes(values.action);
                        onChange({ resource, action: keepAction ? values.action : "" });
                    }}
                >
                    <option value="">Selecciona un recurso</option>
                    {resources.map((resource) => (
                        <option key={resource} value={resource}>
                            {resource === "*" ? "* (todos los recursos)" : resource}
                        </option>
                    ))}
                </select>
            </FormField>
            <FormField id={`${prefix}-action`} label="Acción" required error={errors.action}>
                <select
                    id={`${prefix}-action`}
                    data-cy={`${prefix}-action`}
                    className="p-inputtext p-component w-full"
                    value={values.action}
                    disabled={!values.resource}
                    onChange={(e) => onChange({ ...values, action: e.target.value })}
                >
                    <option value="">{values.resource ? "Selecciona una acción" : "Primero elige un recurso"}</option>
                    {actions.map((action) => (
                        <option key={action} value={action}>
                            {action === "*" ? "* (todas las acciones)" : action}
                        </option>
                    ))}
                </select>
            </FormField>
        </>
    );
};

/**
 * Permisos (recurso, acción) de la empresa de la sesión (RF-07). Ver exige
 * permissions/read; crear, editar y eliminar, permissions/manage. Recursos y
 * acciones salen del catálogo del servidor (GET /permissions/catalog) más "*".
 */
export const PermissionsPage = () => {
    const application = useApplication();
    const { show } = useGlobalToast();
    const accessToken = useAuthSessionStore((s: AuthSessionState) => s.accessToken);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
    const allowed = canReadPermissions(permissions);
    const canManage = canManagePermissions(permissions);

    const [items, setItems] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [catalog, setCatalog] = useState<PermissionCatalog>(EMPTY_CATALOG);

    const [createValues, setCreateValues] = useState<PermissionValues>(EMPTY_VALUES);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [creating, setCreating] = useState(false);

    const [editing, setEditing] = useState<Permission | null>(null);
    const [editValues, setEditValues] = useState<PermissionValues>(EMPTY_VALUES);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [savingEdit, setSavingEdit] = useState(false);

    const [pendingDelete, setPendingDelete] = useState<Permission | null>(null);
    const [deleting, setDeleting] = useState(false);

    const schema = useMemo(() => createPermissionSchema(catalog), [catalog]);

    const notifyError = useCallback(
        (summary: string, error: unknown) => show({ severity: "error", summary, detail: errorMessage(error), life: 6000 }),
        [show],
    );

    const load = useCallback(() => {
        if (!accessToken || !allowed) return;
        application.authContext.permissions
            .list({ accessToken })
            .then((list) => setItems([...list].sort((a, b) => permissionLabel(a).localeCompare(permissionLabel(b), "es"))))
            .catch((error: unknown) => notifyError("No se pudieron cargar los permisos", error))
            .finally(() => setLoading(false));
    }, [accessToken, allowed, application, notifyError]);

    useEffect(() => {
        load();
    }, [load]);

    // El catálogo solo hace falta para crear o editar.
    useEffect(() => {
        if (!accessToken || !allowed || !canManage) return;
        application.authContext.permissions
            .catalog({ accessToken })
            .then(setCatalog)
            .catch((error: unknown) => notifyError("No se pudo cargar el catálogo de permisos", error));
    }, [accessToken, allowed, canManage, application, notifyError]);

    if (!allowed) {
        return (
            <section className="p-5" data-cy="permissions-access-denied">
                <h1 className="mt-0">Permisos</h1>
                <p>Acceso denegado: necesitas el permiso para ver permisos (permissions/read).</p>
            </section>
        );
    }

    const onCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!accessToken || creating) return;
        const parsed = schema.safeParse(createValues);
        if (!parsed.success) {
            setCreateErrors(fieldErrors(parsed.error));
            return;
        }
        setCreateErrors({});
        setCreating(true);
        try {
            const created = await application.authContext.permissions.create(parsed.data, {
                accessToken,
                idempotencyKey: createIdempotencyKey(),
            });
            show({
                severity: "success",
                summary: "Permiso creado",
                detail: `Se creó el permiso ${permissionLabel(created)}.`,
                life: 4000,
            });
            setCreateValues(EMPTY_VALUES);
            load();
        } catch (error) {
            notifyError("No se pudo crear el permiso", error);
        } finally {
            setCreating(false);
        }
    };

    const openEdit = (permission: Permission) => {
        setEditing(permission);
        setEditValues({
            resource: normalizePermissionPart(permission.resource),
            action: normalizePermissionPart(permission.action),
        });
        setEditErrors({});
    };

    const onSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!accessToken || !editing || savingEdit) return;
        const parsed = schema.safeParse(editValues);
        if (!parsed.success) {
            setEditErrors(fieldErrors(parsed.error));
            return;
        }
        setEditErrors({});
        setSavingEdit(true);
        try {
            await application.authContext.permissions.update(
                { permissionId: editing.id, ...parsed.data },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({ severity: "success", summary: "Permiso actualizado", detail: "Los cambios se guardaron.", life: 3000 });
            setEditing(null);
            load();
        } catch (error) {
            notifyError("No se pudo actualizar el permiso", error);
        } finally {
            setSavingEdit(false);
        }
    };

    const onConfirmDelete = async () => {
        if (!accessToken || !pendingDelete || deleting) return;
        setDeleting(true);
        try {
            await application.authContext.permissions.delete(
                { permissionId: pendingDelete.id },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({
                severity: "success",
                summary: "Permiso eliminado",
                detail: `Se eliminó el permiso ${permissionLabel(pendingDelete)}.`,
                life: 3000,
            });
            setPendingDelete(null);
            load();
        } catch (error) {
            notifyError("No se pudo eliminar el permiso", error);
        } finally {
            setDeleting(false);
        }
    };

    const term = search.trim().toLowerCase();
    const visibleItems = term
        ? items.filter(
              (item) =>
                  item.resource.toLowerCase().includes(term) ||
                  item.action.toLowerCase().includes(term) ||
                  permissionLabel(item).toLowerCase().includes(term),
          )
        : items;

    const columns: TableColumn<Permission>[] = [
        {
            field: "resource",
            header: "Recurso",
            sortable: true,
            body: (row) => <code data-cy="permission-resource">{row.resource}</code>,
        },
        {
            field: "action",
            header: "Acción",
            sortable: true,
            body: (row) => <code data-cy="permission-action">{row.action}</code>,
        },
    ];

    const actions: TableAction<Permission>[] = canManage
        ? [
              { label: "Editar", icon: "pi pi-pencil", onClick: openEdit, cy: "permission-edit" },
              {
                  label: "Eliminar",
                  icon: "pi pi-trash",
                  severity: "danger",
                  onClick: (permission) => setPendingDelete(permission),
                  cy: "permission-delete",
              },
          ]
        : [];

    return (
        <section className="p-5" data-cy="permissions-page">
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }} className="mb-4">
                Permisos
            </h1>

            {canManage ? (
                <section className="surface-card p-4 border-round border-1 border-300 mb-4">
                    <h3 className="mt-0 mb-3">Nuevo permiso</h3>
                    <form onSubmit={onCreate} noValidate>
                        <div className="grid">
                            <div className="col-12 md:col-8">
                                <PermissionFields
                                    prefix="permission-create"
                                    catalog={catalog}
                                    values={createValues}
                                    errors={createErrors}
                                    onChange={setCreateValues}
                                />
                            </div>
                        </div>
                        <p className="text-color-secondary text-sm mt-0">{WILDCARD_HINT}</p>
                        <button
                            type="submit"
                            className="p-button p-component"
                            disabled={creating}
                            data-cy="permission-create-submit"
                        >
                            {creating ? "Creando..." : "Crear permiso"}
                        </button>
                    </form>
                </section>
            ) : (
                <p data-cy="permissions-read-only" className="text-color-secondary mt-0">
                    Solo lectura: no tienes permiso para crear, editar ni eliminar permisos.
                </p>
            )}

            <div className="mb-3">
                <input
                    type="search"
                    data-cy="permissions-search"
                    className="p-inputtext p-component w-full md:w-6"
                    placeholder="Buscar por recurso o acción"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div data-cy="permissions-table" className="surface-card border-round border-1 border-surface-200">
                <GenericTable<Permission>
                    data={visibleItems}
                    columns={columns}
                    actions={actions}
                    loading={loading}
                    emptyMessage="No hay permisos registrados."
                    rowKey="id"
                />
            </div>

            <Dialog
                visible={editing !== null}
                onHide={() => setEditing(null)}
                header="Editar permiso"
                modal
                style={{ width: "90vw", maxWidth: "460px" }}
            >
                <form onSubmit={onSaveEdit} noValidate data-cy="permission-edit-dialog">
                    <PermissionFields
                        prefix="permission-edit"
                        catalog={catalog}
                        values={editValues}
                        errors={editErrors}
                        onChange={setEditValues}
                    />
                    <p className="text-color-secondary text-sm mt-0">
                        Un permiso asignado a roles no se puede editar: cambiaría los accesos de otros usuarios. Quítalo
                        de esos roles o crea un permiso nuevo.
                    </p>
                    <div className="flex gap-2 justify-content-end mt-3">
                        <Button type="button" label="Volver" severity="secondary" onClick={() => setEditing(null)} />
                        <Button type="submit" label="Guardar" loading={savingEdit} data-cy="permission-edit-submit" />
                    </div>
                </form>
            </Dialog>

            <Dialog
                visible={pendingDelete !== null}
                onHide={() => setPendingDelete(null)}
                header="Eliminar permiso"
                modal
                style={{ width: "90vw", maxWidth: "440px" }}
            >
                <div data-cy="permission-delete-dialog">
                    <p>
                        ¿Eliminar el permiso <code>{pendingDelete ? permissionLabel(pendingDelete) : ""}</code>? Si está
                        asignado a roles, primero debes quitárselo a cada rol.
                    </p>
                    <div className="flex gap-2 justify-content-end mt-3">
                        <Button label="Volver" severity="secondary" onClick={() => setPendingDelete(null)} />
                        <Button
                            label="Eliminar"
                            severity="danger"
                            loading={deleting}
                            onClick={onConfirmDelete}
                            data-cy="permission-delete-confirm"
                        />
                    </div>
                </div>
            </Dialog>
        </section>
    );
};
