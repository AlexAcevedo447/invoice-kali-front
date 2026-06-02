import { Toast } from "primereact/toast";
import type { ToastMessageOptions } from "primereact/toast";
import { useRef } from "react";
import { ToastContext } from "./GlobalToastContext";

export const GlobalToastProvider = ({ children }: { children: React.ReactNode }) => {
    const toastRef = useRef<Toast>(null);

    const show = (options: ToastMessageOptions) => {
        toastRef.current?.show(options);
    };

    return (
        <ToastContext.Provider value={{ show }}>
            <Toast ref={toastRef} position="top-right" />
            {children}
        </ToastContext.Provider>
    );
};
