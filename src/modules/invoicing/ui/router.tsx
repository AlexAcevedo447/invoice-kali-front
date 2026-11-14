import { lazy, Suspense } from "react";
import { DeferredComponentFallback } from "@shared/ui/fallbacks/DeferredComponentFallback";
import { Navigate, Route, Routes } from "react-router-dom";

const InvoicesPage = lazy(() => import("./pages/InvoicesPage").then((m) => ({ default: m.InvoicesPage })));
const CustomersPage = lazy(() => import("./pages/CustomersPage").then((m) => ({ default: m.CustomersPage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const InvoiceItemsPage = lazy(() => import("./pages/InvoiceItemsPage").then((m) => ({ default: m.InvoiceItemsPage })));

export const InvoicingRouter = () => (
    <Suspense fallback={<DeferredComponentFallback />}>
        <Routes>
            <Route index element={<Navigate to="invoices" replace />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="invoice-items" element={<InvoiceItemsPage />} />
        </Routes>
    </Suspense>
);
