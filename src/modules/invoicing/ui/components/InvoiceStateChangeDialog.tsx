import { Dialog } from "primereact/dialog";
import type { InvoiceStatus } from "../constants/invoiceStatus";
import { INVOICE_STATUS_MAP } from "../constants/invoiceStatus";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

interface InvoiceStateChangeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newStatus: InvoiceStatus) => void;
    currentStatus: InvoiceStatus;
}

const getAvailableStatusTransitions = (current: InvoiceStatus): InvoiceStatus[] => {
    const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
        draft: ["pending", "cancelled"],
        pending: ["paid", "overdue", "cancelled"],
        paid: [],
        overdue: ["paid", "cancelled"],
        cancelled: [],
    };
    return transitions[current] || [];
};

const statusActionConfig: Record<InvoiceStatus, { icon: string; color: string; bg: string; border: string; description: string }> = {
    paid:      { icon: "pi-check-circle", color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", description: "Marcar como cobrada" },
    pending:   { icon: "pi-clock",        color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA", description: "Enviar al cliente" },
    overdue:   { icon: "pi-exclamation-triangle", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA", description: "Marcar como vencida" },
    cancelled: { icon: "pi-times-circle", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", description: "Anular la factura" },
    draft:     { icon: "pi-file-edit",   color: "#3B82F6", bg: "#F5F3FF", border: "#DDD6FE", description: "Volver a borrador" },
};

export const InvoiceStateChangeDialog = ({
    isOpen,
    onClose,
    onConfirm,
    currentStatus,
}: InvoiceStateChangeDialogProps) => {
    const availableStatuses = getAvailableStatusTransitions(currentStatus);

    return (
        <Dialog
            visible={isOpen}
            onHide={onClose}
            header={
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="pi pi-sync" style={{ color: "#3B82F6" }}></i>
                    <span style={{ fontFamily: "Inter, -apple-system, sans-serif", fontWeight: 700, fontSize: "1rem" }}>Cambiar estado</span>
                </div>
            }
            modal
            style={{ width: "90vw", maxWidth: "420px" }}
        >
            <div style={{ fontFamily: "Inter, -apple-system, sans-serif" }}>
                <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#F9FAFB", borderRadius: "8px", border: "1px solid #F3F4F6" }}>
                    <p style={{ margin: "0 0 0.35rem 0", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Estado actual</p>
                    <InvoiceStatusBadge status={currentStatus} />
                </div>

                {availableStatuses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.5rem", color: "#6B7280" }}>
                        <i className="pi pi-lock" style={{ fontSize: "2rem", marginBottom: "0.75rem", display: "block", color: "#D1D5DB" }}></i>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>Esta factura no puede cambiar de estado.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cambiar a</p>
                        {availableStatuses.map((status) => {
                            const cfg = statusActionConfig[status];
                            return (
                                <button
                                    key={status}
                                    onClick={() => onConfirm(status)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.75rem",
                                        padding: "0.875rem 1rem",
                                        backgroundColor: cfg.bg,
                                        border: `1px solid ${cfg.border}`,
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        width: "100%",
                                        transition: "transform 0.1s, box-shadow 0.1s",
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                                >
                                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <i className={`pi ${cfg.icon}`} style={{ color: cfg.color, fontSize: "1rem" }}></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.875rem" }}>{INVOICE_STATUS_MAP[status].label}</div>
                                        <div style={{ fontSize: "0.775rem", color: "#6B7280", marginTop: "0.1rem" }}>{cfg.description}</div>
                                    </div>
                                    <i className="pi pi-chevron-right" style={{ color: "#D1D5DB", fontSize: "0.75rem", marginLeft: "auto" }}></i>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Dialog>
    );
};
