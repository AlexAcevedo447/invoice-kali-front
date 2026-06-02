import type { PropsWithChildren } from "react";

export const FormActions = ({ children }: PropsWithChildren) => {
    return <div className="flex gap-2 mt-4">{children}</div>;
};
