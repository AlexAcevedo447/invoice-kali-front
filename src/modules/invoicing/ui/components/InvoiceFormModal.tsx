import { Dialog } from "primereact/dialog";
import { CreateInvoiceForm } from "@modules/invoicing/ui/forms/CreateInvoiceForm";
import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";

interface InvoiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    invoiceToEdit?: Invoice | null;
}

export const InvoiceFormModal = ({
    isOpen,
    onClose,
    title,
    invoiceToEdit,
}: InvoiceFormModalProps) => {
    return (
        <Dialog
            visible={isOpen}
            onHide={onClose}
            header={title}
            modal
            style={{ width: "90vw", maxWidth: "600px" }}
        >
            <CreateInvoiceForm invoiceToEdit={invoiceToEdit} onSuccess={onClose} />
        </Dialog>
    );
};
