import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useInvoicingStore } from "../../../../app/state/invoicingStore";
import type { InvoicingState } from "../../../../app/state/invoicingStore";
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
    } = useInvoicingStore() as InvoicingState;

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
        clientName: `Cliente ${inv.customerId.slice(0, 5).toUpperCase()}`,
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


    // KPI calculations
    const totalAmount = tableData.reduce((sum, inv) => sum + inv.amount, 0);
    const pendingCount = tableData.filter(inv => inv.status === "pending").length;
    const paidCount = tableData.filter(inv => inv.status === "paid").length;
    const paidAmount = tableData.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);

    const kpiCardStyle: React.CSSProperties = {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        flex: 1,
        minWidth: 0,
    };

    return (
        <div style={{ padding: "2rem" }}>
            <Toast ref={toastRef} />

            {/* Header */}
            <div className="flex justify-content-between align-items-start mb-4">
                <div>
                    <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "#111827", fontFamily: "Inter, -apple-system, sans-serif" }}>
                        Gestión de Facturas
                    </h1>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#6B7280", fontSize: "0.9rem" }}>
                        Administra y controla todas tus facturas en un solo lugar
                    </p>
                </div>
                <button
                    onClick={() => { setSelectedInvoiceId(null); setIsFormModalOpen(true); }}
                    style={{
                        backgroundColor: "#3B82F6",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.65rem 1.25rem",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "background-color 0.2s",
                        fontFamily: "Inter, -apple-system, sans-serif",
                    }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = "#2563EB")}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = "#3B82F6")}
                >
                    <i className="pi pi-plus" style={{ fontSize: "0.85rem" }}></i>
                    Crear Factura
                </button>
            </div>

            {/* KPI Cards */}
            <div className="flex gap-3 mb-4" style={{ flexWrap: "wrap" }}>
                <div style={kpiCardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="pi pi-file-edit" style={{ color: "#3B82F6", fontSize: "1rem" }}></i>
                        </div>
                        <span style={{ color: "#6B7280", fontSize: "0.825rem", fontWeight: 500 }}>Total Facturado</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
                        ${totalAmount.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "0.25rem" }}>{tableData.length} facturas en total</div>
                </div>

                <div style={kpiCardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="pi pi-clock" style={{ color: "#F97316", fontSize: "1rem" }}></i>
                        </div>
                        <span style={{ color: "#6B7280", fontSize: "0.825rem", fontWeight: 500 }}>Pendientes de Pago</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
                        {pendingCount}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "0.25rem" }}>facturas por cobrar</div>
                </div>

                <div style={kpiCardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="pi pi-check-circle" style={{ color: "#16A34A", fontSize: "1rem" }}></i>
                        </div>
                        <span style={{ color: "#6B7280", fontSize: "0.825rem", fontWeight: 500 }}>Ingresos Recibidos</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
                        ${paidAmount.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "0.25rem" }}>{paidCount} facturas pagadas</div>
                </div>
            </div>

            {/* Table Card */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
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
