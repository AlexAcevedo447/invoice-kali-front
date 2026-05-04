import { Tag } from "primereact/tag";
import type { InvoiceStatus } from "../constants/invoiceStatus";
import { getStatusInfo } from "../constants/invoiceStatus";

interface InvoiceStatusBadgeProps {
    status: InvoiceStatus;
}

export const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
    const statusInfo = getStatusInfo(status);

    const severityMap: Record<InvoiceStatus, "success" | "secondary" | "info" | "warning" | "danger"> = {
        draft: "secondary",
        pending: "warning",
        paid: "success",
        overdue: "danger",
        cancelled: "secondary",
    };

    return (
        <Tag
            value={statusInfo.label}
            severity={severityMap[status]}
            style={{ fontSize: "0.875rem" }}
        />
    );
};
