import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { useApplication } from "@app/application/useApplication";
import { useAuthSessionStore, type AuthSessionState } from "@app/state/authSessionStore";
import { createIdempotencyKey } from "@app/state/createIdempotencyKey";
import { canManageTenants } from "@app/routing/access";
import type { Tenant } from "@modules/auth-context/domain/entities/Tenant";
import { FormField } from "@shared/ui/forms/FormField";
import { GenericTable, type TableAction, type TableColumn } from "@shared/ui/table/GenericTable";
import { useGlobalToast } from "@shared/ui/GlobalToastContext";
import {
    TENANT_CODE_HINT,
    createTenantSchema,
    editTenantSchema,
    fieldErrors,
    normalizeTenantCode,
} from "../forms/tenantForm.schema";

const errorMessage = (error: unknown) =>
    error instanceof Error && error.message ? error.message : "Error inesperado.";

const STATUS_LABEL: Record<Tenant["status"], { label: string; severity: "success" | "danger" }> = {
    ACTIVE: { label: "Activa", severity: "success" },
    SUSPENDED: { label: "Suspendida", severity: "danger" },
};

type PendingStatusChange = { tenant: Tenant; action: "suspend" | "activate" };

/**
 * Administración de empresas (RF-05). Solo la empresa de plataforma puede usarla;
 * el servidor lo exige (403) y la interfaz no muestra datos a nadie más.
 */
export const TenantsPage = () => {
    const application = useApplication();
    const { show } = useGlobalToast();
    const accessToken = useAuthSessionStore((s: AuthSessionState) => s.accessToken);
    const isPlatformTenant = useAuthSessionStore((s: AuthSessionState) => s.isPlatformTenant);
    // Empresa de la sesión = empresa de plataforma: no se puede suspender (el servidor responde 409).
    const ownTenantId = useAuthSessionStore((s: AuthSessionState) => s.tenantId);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);
    const allowed = canManageTenants(isPlatformTenant, permissions);

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [createValues, setCreateValues] = useState({ name: "", code: "" });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [creating, setCreating] = useState(false);

    const [editing, setEditing] = useState<Tenant | null>(null);
    const [editValues, setEditValues] = useState({ name: "", code: "" });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [savingEdit, setSavingEdit] = useState(false);

    const [pendingStatus, setPendingStatus] = useState<PendingStatusChange | null>(null);
    const [changingStatus, setChangingStatus] = useState(false);

    const load = useCallback(() => {
        if (!accessToken || !allowed) return;
        application.authContext.tenants
            .list({ accessToken })
            .then((list) => setTenants([...list].sort((a, b) => a.name.localeCompare(b.name, "es"))))
            .catch((error: unknown) =>
                show({ severity: "error", summary: "No se pudieron cargar las empresas", detail: errorMessage(error), life: 5000 }),
            )
            .finally(() => setLoading(false));
    }, [accessToken, allowed, application, show]);

    useEffect(() => {
        load();
    }, [load]);

    if (!allowed) {
        return (
            <section className="p-5" data-cy="tenants-access-denied">
                <h1 className="mt-0">Empresas</h1>
                <p>Acceso denegado: solo el administrador de la plataforma puede gestionar empresas.</p>
            </section>
        );
    }

    const onCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!accessToken || creating) return;
        const parsed = createTenantSchema.safeParse(createValues);
        if (!parsed.success) {
            setCreateErrors(fieldErrors(parsed.error));
            return;
        }
        setCreateErrors({});
        setCreating(true);
        try {
            const created = await application.authContext.tenants.create(parsed.data, {
                accessToken,
                idempotencyKey: createIdempotencyKey(),
            });
            show({
                severity: "success",
                summary: "Empresa creada",
                detail: `"${created.name}" quedó activa con el código ${created.code}.`,
                life: 4000,
            });
            setCreateValues({ name: "", code: "" });
            load();
        } catch (error) {
            show({ severity: "error", summary: "No se pudo crear la empresa", detail: errorMessage(error), life: 5000 });
        } finally {
            setCreating(false);
        }
    };

    const openEdit = (tenant: Tenant) => {
        setEditing(tenant);
        setEditValues({ name: tenant.name, code: tenant.code });
        setEditErrors({});
    };

    const onSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!accessToken || !editing || savingEdit) return;
        const parsed = editTenantSchema.safeParse(editValues);
        if (!parsed.success) {
            setEditErrors(fieldErrors(parsed.error));
            return;
        }
        setSavingEdit(true);
        try {
            // Se conserva el estado actual: editar no suspende ni activa (CA-05.5).
            await application.authContext.tenants.update(
                { tenantId: editing.id, name: parsed.data.name, code: parsed.data.code, status: editing.status },
                { accessToken, idempotencyKey: createIdempotencyKey() },
            );
            show({ severity: "success", summary: "Empresa actualizada", detail: "Los cambios se guardaron.", life: 3000 });
            setEditing(null);
            load();
        } catch (error) {
            show({ severity: "error", summary: "No se pudo actualizar la empresa", detail: errorMessage(error), life: 5000 });
        } finally {
            setSavingEdit(false);
        }
    };

    const onConfirmStatus = async () => {
        if (!accessToken || !pendingStatus || changingStatus) return;
        const { tenant, action } = pendingStatus;
        setChangingStatus(true);
        try {
            const options = { accessToken, idempotencyKey: createIdempotencyKey() };
            if (action === "suspend") {
                await application.authContext.tenants.suspend({ tenantId: tenant.id }, options);
            } else {
                await application.authContext.tenants.activate({ tenantId: tenant.id }, options);
            }
            show({
                severity: "success",
                summary: action === "suspend" ? "Empresa suspendida" : "Empresa activada",
                detail: `"${tenant.name}" ahora está ${action === "suspend" ? "suspendida" : "activa"}.`,
                life: 3000,
            });
            setPendingStatus(null);
            load();
        } catch (error) {
            show({ severity: "error", summary: "No se pudo cambiar el estado", detail: errorMessage(error), life: 5000 });
        } finally {
            setChangingStatus(false);
        }
    };

    const term = search.trim().toLowerCase();
    const visibleTenants = term
        ? tenants.filter((t) => t.name.toLowerCase().includes(term) || t.code.includes(term))
        : tenants;

    const columns: TableColumn<Tenant>[] = [
        {
            field: "name",
            header: "Empresa",
            sortable: true,
            body: (row) => <span data-cy="tenant-name">{row.name}</span>,
        },
        {
            field: "code",
            header: "Código",
            sortable: true,
            body: (row) => <code data-cy="tenant-code">{row.code}</code>,
        },
        {
            field: "status",
            header: "Estado",
            body: (row) => (
                <Tag data-cy="tenant-status" value={STATUS_LABEL[row.status].label} severity={STATUS_LABEL[row.status].severity} />
            ),
        },
    ];

    const actions: TableAction<Tenant>[] = [
        { label: "Editar", icon: "pi pi-pencil", onClick: openEdit, cy: "tenant-edit" },
        {
            label: "Suspender",
            icon: "pi pi-ban",
            severity: "danger",
            onClick: (tenant) => setPendingStatus({ tenant, action: "suspend" }),
            disabled: (tenant) => tenant.status === "SUSPENDED" || tenant.id === ownTenantId,
            tooltip: (tenant) =>
                tenant.id === ownTenantId ? "La empresa de la plataforma no se puede suspender" : "Suspender",
            cy: "tenant-suspend",
        },
        {
            label: "Activar",
            icon: "pi pi-check",
            severity: "success",
            onClick: (tenant) => setPendingStatus({ tenant, action: "activate" }),
            disabled: (tenant) => tenant.status === "ACTIVE",
            cy: "tenant-activate",
        },
    ];

    return (
        <section className="p-5" data-cy="tenants-page">
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }} className="mb-4">
                Empresas
            </h1>

            <section className="surface-card p-4 border-round border-1 border-300 mb-4">
                <h3 className="mt-0 mb-3">Nueva empresa</h3>
                <form onSubmit={onCreate} noValidate className="grid">
                    <div className="col-12 md:col-5">
                        <FormField id="tenant-create-name" label="Nombre" required error={createErrors.name}>
                            <input
                                id="tenant-create-name"
                                data-cy="tenant-create-name"
                                className="p-inputtext p-component w-full"
                                value={createValues.name}
                                onChange={(e) => setCreateValues((v) => ({ ...v, name: e.target.value }))}
                            />
                        </FormField>
                    </div>
                    <div className="col-12 md:col-4">
                        <FormField
                            id="tenant-create-code"
                            label="Código (opcional)"
                            hint={`Si lo dejas vacío se genera a partir del nombre. ${TENANT_CODE_HINT}`}
                            error={createErrors.code}
                        >
                            <input
                                id="tenant-create-code"
                                data-cy="tenant-create-code"
                                className="p-inputtext p-component w-full"
                                value={createValues.code}
                                onChange={(e) => setCreateValues((v) => ({ ...v, code: e.target.value }))}
                            />
                        </FormField>
                    </div>
                    <div className="col-12">
                        <button type="submit" className="p-button p-component" disabled={creating} data-cy="tenant-create-submit">
                            {creating ? "Creando..." : "Crear empresa"}
                        </button>
                    </div>
                </form>
            </section>

            <div className="mb-3">
                <input
                    type="search"
                    data-cy="tenants-search"
                    className="p-inputtext p-component w-full md:w-6"
                    placeholder="Buscar por nombre o código"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div data-cy="tenants-table" className="surface-card border-round border-1 border-surface-200">
                <GenericTable<Tenant>
                    data={visibleTenants}
                    columns={columns}
                    actions={actions}
                    loading={loading}
                    emptyMessage="No hay empresas registradas."
                    rowKey="id"
                />
            </div>

            <Dialog
                visible={editing !== null}
                onHide={() => setEditing(null)}
                header="Editar empresa"
                modal
                style={{ width: "90vw", maxWidth: "460px" }}
            >
                <form onSubmit={onSaveEdit} noValidate data-cy="tenant-edit-dialog">
                    <FormField id="tenant-edit-name" label="Nombre" required error={editErrors.name}>
                        <input
                            id="tenant-edit-name"
                            data-cy="tenant-edit-name"
                            className="p-inputtext p-component w-full"
                            value={editValues.name}
                            onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        />
                    </FormField>
                    <FormField
                        id="tenant-edit-code"
                        label="Código"
                        required
                        hint={TENANT_CODE_HINT}
                        error={editErrors.code}
                    >
                        <input
                            id="tenant-edit-code"
                            data-cy="tenant-edit-code"
                            className="p-inputtext p-component w-full"
                            value={editValues.code}
                            onChange={(e) => setEditValues((v) => ({ ...v, code: e.target.value }))}
                        />
                    </FormField>
                    {editing && normalizeTenantCode(editValues.code) !== editing.code ? (
                        <div
                            data-cy="tenant-code-warning"
                            role="alert"
                            className="p-2 mt-2 border-round border-1 border-orange-300 bg-orange-50 text-orange-800"
                        >
                            Cambiar el código puede afectar el próximo inicio de sesión: los usuarios que
                            ingresan con el código "{editing.code}" deberán usar el nuevo.
                        </div>
                    ) : null}
                    <div className="flex gap-2 justify-content-end mt-3">
                        <Button type="button" label="Volver" severity="secondary" onClick={() => setEditing(null)} />
                        <Button type="submit" label="Guardar" loading={savingEdit} data-cy="tenant-edit-submit" />
                    </div>
                </form>
            </Dialog>

            <Dialog
                visible={pendingStatus !== null}
                onHide={() => setPendingStatus(null)}
                header={pendingStatus?.action === "suspend" ? "Suspender empresa" : "Activar empresa"}
                modal
                style={{ width: "90vw", maxWidth: "440px" }}
            >
                <div data-cy="tenant-status-dialog">
                    {pendingStatus?.action === "suspend" ? (
                        <p>
                            ¿Suspender <strong>{pendingStatus.tenant.name}</strong>? Sus usuarios no podrán iniciar sesión
                            hasta que la actives de nuevo.
                        </p>
                    ) : (
                        <p>
                            ¿Activar <strong>{pendingStatus?.tenant.name}</strong>? Sus usuarios podrán volver a iniciar sesión.
                        </p>
                    )}
                    <div className="flex gap-2 justify-content-end mt-3">
                        <Button label="Volver" severity="secondary" onClick={() => setPendingStatus(null)} />
                        <Button
                            label={pendingStatus?.action === "suspend" ? "Suspender" : "Activar"}
                            severity={pendingStatus?.action === "suspend" ? "danger" : "success"}
                            loading={changingStatus}
                            onClick={onConfirmStatus}
                            data-cy="tenant-status-confirm"
                        />
                    </div>
                </div>
            </Dialog>
        </section>
    );
};
