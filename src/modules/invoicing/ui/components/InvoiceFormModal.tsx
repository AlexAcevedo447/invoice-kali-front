import { Dialog } from "primereact/dialog";
import { CreateInvoiceForm } from "../forms/CreateInvoiceForm";

interface InvoiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

export const InvoiceFormModal = ({
    isOpen,
    onClose,
    title,
}: InvoiceFormModalProps) => {
    return (
        <Dialog
            visible={isOpen}
            onHide={onClose}
            header={title}
            modal
            style={{ width: "90vw", maxWidth: "600px" }}
        >
            <CreateInvoiceForm />
        </Dialog>
    );
};
