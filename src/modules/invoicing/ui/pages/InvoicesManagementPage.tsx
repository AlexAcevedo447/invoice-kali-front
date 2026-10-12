import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useInvoicingStore } from "@app/state/invoicingStore";
import type { InvoicingState } from "@app/state/invoicingStore";
import { InvoiceFormModal } from "@modules/invoicing/ui/components/InvoiceFormModal";
import { InvoicesTable } from "@modules/invoicing/ui/components/InvoicesTable";
import { InvoiceStateChangeDialog } from "@modules/invoicing/ui/components/InvoiceStateChangeDialog";
import { InvoiceDeleteConfirmDialog } from "@modules/invoicing/ui/components/InvoiceDeleteConfirmDialog";
import type { InvoiceStatus } from "@modules/invoicing/ui/constants/invoiceStatus";

interface InvoiceTableData {
    id: string;
    number: string;
    clientName: string;
    amount: number;
    status: InvoiceStatus;
    dueDate: string;
}

const mapDomainStatusToUI = (status: string): InvoiceStatus => {
    const statusMap: { [key: string]: InvoiceStatus } = {
        "PENDING": "pending",
        "PAID": "paid",
        "CANCELED": "cancelled",
    };
    return (statusMap[status] ?? "draft") as InvoiceStatus;
};

export const InvoicesManagementPage = () => {
    const toastRef = useRef<Toast>(null);
    const hasLoadedRef = useRef(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [stateChangeDialogOpen, setStateChangeDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
        null
    );

    const {
        invoices,
        isLoading,
        error,
        page,
        pageSize,
        total,
        actions: {
            loadInvoices,
            payInvoice,
            cancelInvoice,
        },
    } = useInvoicingStore() as InvoicingState;

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        loadInvoices(1).catch(() => {
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: "No se pudieron cargar las facturas",
            });
        });
    }, [loadInvoices]);

    useEffect(() => {
        if (error) {
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: error,
            });
        }
    }, [error]);

    const tableData: InvoiceTableData[] = invoices.map((inv) => ({
        id: inv.id,
        number: `FAC-${inv.id.slice(0, 8).toUpperCase()}`,
        clientName: inv.customerId,
        amount: inv.total,
        status: mapDomainStatusToUI(inv.status),
        // Se conserva la fecha completa: recortarla a YYYY-MM-DD la interpretaba
        // como UTC y en zonas UTC-5 mostraba el día anterior.
        dueDate: inv.dueDate
            ? new Date(inv.dueDate).toISOString()
            : new Date().toISOString(),
    }));

    const selectedInvoice = tableData.find((inv) => inv.id === selectedInvoiceId);
    const selectedInvoiceEntity = invoices.find((inv) => inv.id === selectedInvoiceId) ?? null;

    const handleEdit = (invoiceId: string) => {
        // Solo las facturas Pendientes son editables (Pagada/Cancelada quedan cerradas).
        const invoice = invoices.find((inv) => inv.id === invoiceId);
        if (!invoice || invoice.status !== "PENDING") return;
        setSelectedInvoiceId(invoiceId);
        setIsFormModalOpen(true);
    };

    const isPending = (invoiceId: string) =>
        invoices.find((inv) => inv.id === invoiceId)?.status === "PENDING";

    const handleChangeStatus = (invoiceId: string) => {
        if (!isPending(invoiceId)) return;
        setSelectedInvoiceId(invoiceId);
        setStateChangeDialogOpen(true);
    };

    const handleDelete = (invoiceId: string) => {
        if (!isPending(invoiceId)) return;
        setSelectedInvoiceId(invoiceId);
        setDeleteDialogOpen(true);
    };

    const showSuccess = (detail: string) => {
        toastRef.current?.show({ severity: "success", summary: "Éxito", detail });
    };

    // Las acciones del store devuelven null cuando el backend responde con error;
    // en ese caso el error ya se muestra desde el efecto de `error`, así que el
    // aviso de éxito se muestra únicamente si hubo respuesta exitosa.
    const handleConfirmStateChange = async (newStatus: InvoiceStatus) => {
        if (!selectedInvoiceId) return;

        if (newStatus === "paid") {
            const result = await payInvoice(selectedInvoiceId);
            if (result) showSuccess("Factura marcada como pagada");
        } else if (newStatus === "cancelled") {
            const result = await cancelInvoice(selectedInvoiceId);
            if (result) showSuccess("Factura cancelada");
        }

        setStateChangeDialogOpen(false);
        setSelectedInvoiceId(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedInvoiceId) return;

        const result = await cancelInvoice(selectedInvoiceId);
        if (result) showSuccess("Factura cancelada");

        setDeleteDialogOpen(false);
        setSelectedInvoiceId(null);
    };

    const handleSaved = (mode: "created" | "updated") => {
        if (mode === "created") {
            showSuccess("Factura creada correctamente");
            // La nueva factura queda primera (orden por fecha de creación): volver a la página 1.
            void loadInvoices(1);
        } else {
            showSuccess("Factura actualizada correctamente");
            // Recarga la página actual: las líneas editadas cambian los totales.
            void loadInvoices(page, pageSize);
        }
    };

    const handlePage = (first: number, rows: number) => {
        void loadInvoices(Math.floor(first / rows) + 1, rows);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setSelectedInvoiceId(null);
    };


    return (
        <div className="p-5">
            <Toast ref={toastRef} />

            <div className="flex justify-content-between align-items-center mb-4">
                <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }}>
                    Gestión de Facturas
                </h1>
                <Button
                    label="Crear Factura"
                    icon="pi pi-plus"
                    onClick={() => {
                        setSelectedInvoiceId(null);
                        setIsFormModalOpen(true);
                    }}
                    size="large"
                />
            </div>

            <div className="surface-card border-round border-1 border-surface-200 p-0">
                <InvoicesTable
                    invoices={tableData}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onChangeStatus={handleChangeStatus}
                    onDelete={handleDelete}
                    serverPagination={{
                        totalRecords: total,
                        first: (page - 1) * pageSize,
                        rows: pageSize,
                        onPage: handlePage,
                    }}
                />
            </div>

            <InvoiceFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                title={selectedInvoiceId ? "Editar Factura" : "Crear Nueva Factura"}
                invoiceToEdit={selectedInvoiceEntity}
                onSaved={handleSaved}
            />

            {selectedInvoice && (
                <>
                    <InvoiceStateChangeDialog
                        isOpen={stateChangeDialogOpen}
                        onClose={() => setStateChangeDialogOpen(false)}
                        onConfirm={handleConfirmStateChange}
                        currentStatus={selectedInvoice.status}
                    />

                    <InvoiceDeleteConfirmDialog
                        isOpen={deleteDialogOpen}
                        onClose={() => setDeleteDialogOpen(false)}
                        onConfirm={handleConfirmDelete}
                        invoiceNumber={selectedInvoice.number}
                    />
                </>
            )}
        </div>
    );
};
