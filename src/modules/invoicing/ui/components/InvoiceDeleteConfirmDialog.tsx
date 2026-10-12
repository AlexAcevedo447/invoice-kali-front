import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

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
            header="Cancelar factura"
            modal
            style={{ width: "90vw", maxWidth: "400px" }}
        >
            <div className="flex flex-column gap-2">
                <p>
                    {invoiceNumber ? (
                        <>
                            ¿Estás seguro de que quieres cancelar la factura <strong>{invoiceNumber}</strong>?
                            Quedará en estado Cancelada y esta acción no se puede deshacer.
                        </>
                    ) : (
                        "¿Estás seguro de que quieres cancelar esta factura? Quedará en estado Cancelada y esta acción no se puede deshacer."
                    )}
                </p>
            </div>

            <div className="flex gap-2 justify-content-end mt-3">
                <Button label="Volver" severity="secondary" onClick={onClose} />
                <Button
                    label="Cancelar factura"
                    severity="danger"
                    onClick={onConfirm}
                />
            </div>
        </Dialog>
    );
};
