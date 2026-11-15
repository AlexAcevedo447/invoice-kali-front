import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { useInvoicingStore, type InvoicingState } from "@app/state/invoicingStore";
import type { Invoice } from "@modules/invoicing/domain/entities/Invoice";
import { formatAmount, formatRatePercent, mapDomainStatusToUI, TAX_KIND_LABELS } from "../constants/invoiceFormat";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatEsCoDecimal } from "@shared/domain/esCoDecimal";

interface InvoiceViewDialogProps {
    /** Factura a consultar; null cierra el diálogo. */
    invoiceId: string | null;
    onClose: () => void;
}

type LoadState =
    | { status: "loading" }
    | { status: "loaded"; invoice: Invoice }
    | { status: "error"; message: string };

const formatDate = (value: Date | null): string =>
    value ? value.toLocaleDateString("es-ES") : "—";

/**
 * Vista de solo lectura de una factura (D4-06), con invoices/read: carga
 * GET /invoices/:id y muestra cada línea con TODOS sus impuestos. Los totales
 * son los del servidor (no se recalculan); `data-value` expone el número tal
 * cual llegó para que las pruebas lo comparen exactamente.
 */
export const InvoiceViewDialog = ({ invoiceId, onClose }: InvoiceViewDialogProps) => {
    const fetchInvoice = useInvoicingStore((state: InvoicingState) => state.actions.fetchInvoice);
    const [loaded, setLoaded] = useState<{ id: string; state: LoadState } | null>(null);

    useEffect(() => {
        if (!invoiceId) return;
        let active = true;
        fetchInvoice(invoiceId)
            .then((invoice) => {
                if (active) setLoaded({ id: invoiceId, state: { status: "loaded", invoice } });
            })
            .catch((error: unknown) => {
                if (!active) return;
                const message = error instanceof Error ? error.message : "No se pudo cargar la factura.";
                setLoaded({ id: invoiceId, state: { status: "error", message } });
            });
        return () => {
            active = false;
        };
    }, [fetchInvoice, invoiceId]);

    // Mientras llega la respuesta de la factura pedida se muestra "Cargando".
    const state: LoadState =
        loaded && loaded.id === invoiceId ? loaded.state : { status: "loading" };

    return (
        <Dialog
            visible={Boolean(invoiceId)}
            onHide={onClose}
            header="Detalle de la factura"
            modal
            style={{ width: "90vw", maxWidth: "800px" }}
        >
            <div data-cy="invoice-view-dialog">
                {state.status === "loading" ? (
                    <p data-cy="invoice-view-loading">Cargando factura…</p>
                ) : null}
                {state.status === "error" ? (
                    <p role="alert" className="text-red-500" data-cy="invoice-view-error">
                        {state.message}
                    </p>
                ) : null}
                {state.status === "loaded" ? <InvoiceView invoice={state.invoice} /> : null}
            </div>
        </Dialog>
    );
};

const InvoiceView = ({ invoice }: { invoice: Invoice }) => (
    <>
        <dl className="grid m-0 mb-3 text-break">
            <div className="col-12 md:col-6">
                <dt className="font-medium">Cliente</dt>
                <dd className="m-0" data-cy="invoice-view-customer">
                    {invoice.customerName
                        ? `${invoice.customerName} (${invoice.customerDocument})`
                        : "Cliente no disponible"}
                </dd>
            </div>
            <div className="col-12 md:col-6">
                <dt className="font-medium">Estado</dt>
                <dd className="m-0" data-cy="invoice-view-status" data-value={invoice.status}>
                    <InvoiceStatusBadge status={mapDomainStatusToUI(invoice.status)} />
                </dd>
            </div>
            <div className="col-12 md:col-6">
                <dt className="font-medium">Fecha de emisión</dt>
                <dd className="m-0" data-cy="invoice-view-issue-date">{formatDate(invoice.issueDate)}</dd>
            </div>
            <div className="col-12 md:col-6">
                <dt className="font-medium">Fecha de vencimiento</dt>
                <dd className="m-0" data-cy="invoice-view-due-date">{formatDate(invoice.dueDate)}</dd>
            </div>
        </dl>

        <h4 className="mt-0 mb-2">Líneas</h4>
        {invoice.items.length === 0 ? <p className="text-color-secondary">La factura no tiene líneas.</p> : null}
        {invoice.items.map((line, lineIndex) => (
            <div
                key={line.id}
                className="border-1 border-300 border-round p-3 mb-3"
                data-cy="invoice-view-line"
                data-line-id={line.id}
            >
                <div className="flex flex-wrap justify-content-between gap-2 mb-2">
                    <strong data-cy="invoice-view-line-product" className="text-break">
                        {lineIndex + 1}. {line.productCode} — {line.productName}
                    </strong>
                    <span>
                        Cantidad: <span data-cy="invoice-view-line-quantity" data-value={line.quantity}>{formatEsCoDecimal(line.quantity)}</span>
                        {" · "}
                        Precio unitario:{" "}
                        <span data-cy="invoice-view-line-unit-price" data-value={line.unitPrice}>
                            {formatAmount(line.unitPrice)}
                        </span>
                    </span>
                </div>

                {line.taxes.length === 0 ? (
                    <p className="text-color-secondary m-0 mb-2" data-cy="invoice-view-no-taxes">
                        Sin impuestos
                    </p>
                ) : (
                    // La tabla se desplaza dentro de su contenedor en pantallas angostas.
                    <div className="table-scroll mb-2" data-cy="invoice-view-taxes-scroll">
                        <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr className="text-left">
                                    <th>Código</th>
                                    <th>Tipo</th>
                                    <th>Tarifa</th>
                                    <th className="text-right">Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {line.taxes.map((tax, taxIndex) => (
                                    <tr key={tax.id || taxIndex} data-cy="invoice-view-tax">
                                        <td data-cy="invoice-view-tax-code" className="text-break">{tax.code}</td>
                                        <td data-cy="invoice-view-tax-kind" data-value={tax.kind}>
                                            {TAX_KIND_LABELS[tax.kind] ?? tax.kind}
                                        </td>
                                        <td data-cy="invoice-view-tax-rate" data-value={tax.rate}>
                                            {formatRatePercent(tax.rate)}
                                        </td>
                                        <td
                                            className="text-right"
                                            data-cy="invoice-view-tax-amount"
                                            data-value={tax.amount}
                                        >
                                            {tax.kind === "CREDIT" ? "−" : ""}
                                            {formatAmount(tax.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-wrap justify-content-end gap-4">
                    <span>
                        Subtotal:{" "}
                        <span data-cy="invoice-view-line-subtotal" data-value={line.subtotal}>
                            {formatAmount(line.subtotal)}
                        </span>
                    </span>
                    <span>
                        Impuestos:{" "}
                        <span data-cy="invoice-view-line-tax-total" data-value={line.taxTotal}>
                            {formatAmount(line.taxTotal)}
                        </span>
                    </span>
                    <strong>
                        Total:{" "}
                        <span data-cy="invoice-view-line-total" data-value={line.total}>
                            {formatAmount(line.total)}
                        </span>
                    </strong>
                </div>
            </div>
        ))}

        <div className="flex flex-column align-items-end gap-1">
            <span>
                Subtotal:{" "}
                <span data-cy="invoice-view-subtotal" data-value={invoice.subtotal}>
                    {formatAmount(invoice.subtotal)}
                </span>
            </span>
            <span>
                Impuestos:{" "}
                <span data-cy="invoice-view-tax-total" data-value={invoice.taxTotal}>
                    {formatAmount(invoice.taxTotal)}
                </span>
            </span>
            <strong>
                Total:{" "}
                <span data-cy="invoice-view-total" data-value={invoice.total}>
                    {formatAmount(invoice.total)}
                </span>
            </strong>
        </div>
    </>
);
