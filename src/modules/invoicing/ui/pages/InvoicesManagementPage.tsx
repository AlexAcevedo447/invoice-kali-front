import { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useInvoicingStore } from "@app/state";
import { InvoiceFormModal } from "../components/InvoiceFormModal";
import { InvoicesTable } from "../components/InvoicesTable";
import { InvoiceStateChangeDialog } from "../components/InvoiceStateChangeDialog";
import { InvoiceDeleteConfirmDialog } from "../components/InvoiceDeleteConfirmDialog";
import type { InvoiceStatus } from "../constants/invoiceStatus";

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
        actions: {
            loadInvoices,
            payInvoice,
            cancelInvoice,
        },
    } = useInvoicingStore();

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        loadInvoices().catch(() => {
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
        dueDate: inv.dueDate
            ? new Date(inv.dueDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
    }));

    const selectedInvoice = tableData.find((inv) => inv.id === selectedInvoiceId);
    const selectedInvoiceEntity = invoices.find((inv) => inv.id === selectedInvoiceId) ?? null;

    const handleEdit = (invoiceId: string) => {
        setSelectedInvoiceId(invoiceId);
        setIsFormModalOpen(true);
    };

    const handleChangeStatus = (invoiceId: string) => {
        setSelectedInvoiceId(invoiceId);
        setStateChangeDialogOpen(true);
    };

    const handleDelete = (invoiceId: string) => {
        setSelectedInvoiceId(invoiceId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmStateChange = async (newStatus: InvoiceStatus) => {
        if (!selectedInvoiceId) return;

        try {
            if (newStatus === "paid") {
                await payInvoice(selectedInvoiceId);
                toastRef.current?.show({
                    severity: "success",
                    summary: "Éxito",
                    detail: "Factura marcada como pagada",
                });
            } else if (newStatus === "cancelled") {
                await cancelInvoice(selectedInvoiceId);
                toastRef.current?.show({
                    severity: "success",
                    summary: "Éxito",
                    detail: "Factura cancelada",
                });
            }
        } catch {
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: "No se pudo cambiar el estado de la factura",
            });
        }

        setStateChangeDialogOpen(false);
        setSelectedInvoiceId(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedInvoiceId) return;

        try {
            await cancelInvoice(selectedInvoiceId);
            toastRef.current?.show({
                severity: "success",
                summary: "Éxito",
                detail: "Factura cancelada",
            });
        } catch {
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: "No se pudo cancelar la factura",
            });
        }

        setDeleteDialogOpen(false);
        setSelectedInvoiceId(null);
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
                />
            </div>

            <InvoiceFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                title={selectedInvoiceId ? "Editar Factura" : "Crear Nueva Factura"}
                invoiceToEdit={selectedInvoiceEntity}
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
