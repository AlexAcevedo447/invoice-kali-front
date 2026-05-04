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
            header="Eliminar factura"
            modal
            style={{ width: "90vw", maxWidth: "400px" }}
        >
            <div className="flex flex-column gap-2">
                <p>
                    {invoiceNumber ? (
                        <>
                            ¿Estás seguro de que quieres eliminar la factura <strong>{invoiceNumber}</strong>?
                            Esta acción no se puede deshacer.
                        </>
                    ) : (
                        "¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer."
                    )}
                </p>
            </div>

            <div className="flex gap-2 justify-content-end mt-3">
                <Button label="Cancelar" severity="secondary" onClick={onClose} />
                <Button
                    label="Eliminar"
                    severity="danger"
                    onClick={onConfirm}
                />
            </div>
        </Dialog>
    );
};
