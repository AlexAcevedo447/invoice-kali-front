import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const InvoicesPage = lazy(() => import("./pages/InvoicesPage").then((m) => ({ default: m.InvoicesPage })));
const InvoiceItemsPage = lazy(() => import("./pages/InvoiceItemsPage").then((m) => ({ default: m.InvoiceItemsPage })));

export const InvoicingRouter = () => (
    <Suspense fallback={null}>
        <Routes>
            <Route index element={<Navigate to="invoices" replace />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoice-items" element={<InvoiceItemsPage />} />
        </Routes>
    </Suspense>
);
