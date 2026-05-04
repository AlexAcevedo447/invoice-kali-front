import type { ButtonHTMLAttributes } from "react";

interface SubmitButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    isSubmitting?: boolean;
    label: string;
    loadingLabel?: string;
}

export const SubmitButton = ({
    isSubmitting,
    label,
    loadingLabel = "Saving...",
    disabled,
    ...buttonProps
}: SubmitButtonProps) => {
    return (
        <button
            type="submit"
            className="p-button p-component"
            disabled={disabled || isSubmitting}
            {...buttonProps}
        >
            {isSubmitting ? loadingLabel : label}
        </button>
    );
};
