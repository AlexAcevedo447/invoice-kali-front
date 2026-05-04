import type { PropsWithChildren, ReactNode } from "react";

interface FormFieldProps extends PropsWithChildren {
    id: string;
    label: string;
    hint?: ReactNode;
    error?: string;
    required?: boolean;
}

export const FormField = ({
    id,
    label,
    hint,
    error,
    required,
    children,
}: FormFieldProps) => {
    return (
        <div className="flex flex-column gap-2 mb-3">
            <label htmlFor={id} className="font-medium">
                {label}
                {required ? " *" : ""}
            </label>
            {children}
            {hint ? <small className="text-color-secondary">{hint}</small> : null}
            {error ? (
                <small role="alert" className="text-red-500">
                    {error}
                </small>
            ) : null}
        </div>
    );
};
