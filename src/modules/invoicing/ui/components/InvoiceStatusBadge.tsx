import type { InvoiceStatus } from "../constants/invoiceStatus";
import { getStatusInfo } from "../constants/invoiceStatus";

interface InvoiceStatusBadgeProps {
    status: InvoiceStatus;
}

const statusStyles: Record<InvoiceStatus, { bg: string; color: string; dot: string }> = {
    draft:     { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
    pending:   { bg: "#FFF7ED", color: "#C2410C", dot: "#F97316" },
    paid:      { bg: "#F0FDF4", color: "#15803D", dot: "#22C55E" },
    overdue:   { bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
    cancelled: { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
};

export const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
    const statusInfo = getStatusInfo(status);
    const style = statusStyles[status];

    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            backgroundColor: style.bg,
            color: style.color,
            borderRadius: "999px",
            padding: "0.25rem 0.75rem",
            fontSize: "0.775rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
        }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: style.dot, flexShrink: 0 }}></span>
            {statusInfo.label}
        </span>
    );
};
