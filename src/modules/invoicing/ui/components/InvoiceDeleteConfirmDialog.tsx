import { Dialog } from "primereact/dialog";

interface InvoiceDeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    invoiceNumber?: string;
}

export const InvoiceDeleteConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    invoiceNumber,
}: InvoiceDeleteConfirmDialogProps) => {
    return (
        <Dialog
            visible={isOpen}
            onHide={onClose}
            header={false}
            modal
            closable={false}
            style={{ width: "90vw", maxWidth: "400px" }}
        >
            <div style={{ fontFamily: "Inter, -apple-system, sans-serif", textAlign: "center", padding: "0.5rem" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                    <i className="pi pi-trash" style={{ color: "#DC2626", fontSize: "1.5rem" }}></i>
                </div>

                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                    Anular factura
                </h3>

                <p style={{ margin: "0 0 1.5rem 0", color: "#6B7280", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {invoiceNumber ? (
                        <>¿Seguro que quieres anular la factura <strong style={{ color: "#374151" }}>{invoiceNumber}</strong>? Esta acción no se puede deshacer.</>
                    ) : (
                        "¿Seguro que quieres anular esta factura? Esta acción no se puede deshacer."
                    )}
                </p>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", backgroundColor: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", fontFamily: "Inter, sans-serif" }}
                        onMouseOver={e => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                        onMouseOut={e => (e.currentTarget.style.backgroundColor = "#fff")}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{ flex: 1, padding: "0.75rem", border: "none", borderRadius: "8px", backgroundColor: "#DC2626", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", fontFamily: "Inter, sans-serif" }}
                        onMouseOver={e => (e.currentTarget.style.backgroundColor = "#B91C1C")}
                        onMouseOut={e => (e.currentTarget.style.backgroundColor = "#DC2626")}
                    >
                        Sí, anular
                    </button>
                </div>
            </div>
        </Dialog>
    );
};
