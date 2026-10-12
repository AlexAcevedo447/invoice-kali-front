import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import type { InvoiceStatus } from "@modules/invoicing/ui/constants/invoiceStatus";
import { INVOICE_STATUS_MAP } from "@modules/invoicing/ui/constants/invoiceStatus";

interface InvoiceStateChangeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newStatus: InvoiceStatus) => void;
    currentStatus: InvoiceStatus;
}

// Solo se ofrecen transiciones con endpoint real en el servicio de facturación:
// PENDING → PAID (PATCH /pay) y PENDING → CANCELED (PATCH /cancel).
// "Vencida" y "Borrador" no existen en el backend, así que no se ofrecen.
const getAvailableStatusTransitions = (
    current: InvoiceStatus
): InvoiceStatus[] => {
    const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
        draft: [],
        pending: ["paid", "cancelled"],
        paid: [],
        overdue: [],
        cancelled: [],
    };
    return transitions[current] || [];
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
            header="Cambiar estado"
            modal
            style={{ width: "90vw", maxWidth: "400px" }}
        >
            {availableStatuses.length === 0 ? (
                <p style={{ color: "#ef4444", textAlign: "center" }}>
                    Esta factura no puede cambiar de estado desde "{INVOICE_STATUS_MAP[currentStatus].label}"
                </p>
            ) : (
                <div className="flex flex-column gap-2">
                    {availableStatuses.map((status) => (
                        <Button
                            key={status}
                            label={INVOICE_STATUS_MAP[status].label}
                            onClick={() => onConfirm(status)}
                            text
                            className="p-button-lg text-left"
                        />
                    ))}
                </div>
            )}
        </Dialog>
    );
};
