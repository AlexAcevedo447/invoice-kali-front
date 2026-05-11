
import type { ToastMessageOptions } from "primereact/toast";
import { createContext, useContext } from "react";

export const ToastContext = createContext<{ show: (options: ToastMessageOptions) => void } | undefined>(undefined);

export const useGlobalToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useGlobalToast debe usarse dentro de GlobalToastProvider");
    return ctx;
};