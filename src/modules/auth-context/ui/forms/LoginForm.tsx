import type { FormEvent } from "react";
import { useRef } from "react";
import { useGlobalToast } from "../../../../shared/ui/GlobalToastContext";
import { z } from "zod";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { FormActions } from "../../../../shared/ui/forms/FormActions";
import { FormField } from "../../../../shared/ui/forms/FormField";
import { SubmitButton } from "../../../../shared/ui/forms/SubmitButton";
import { useZodForm } from "../../../../shared/ui/forms/useZodForm";


export const LoginForm = () => {
    const loginSchema = z.object({
        tenantId: z.string().min(1, "Tenant ID is required"),
        email: z.string().email("Enter a valid email"),
        password: z.string().min(1, "Password is required"),
    });

    type LoginFormValues = z.infer<typeof loginSchema>;

    const isSubmittingRef = useRef(false);
    const { show } = useGlobalToast();
    const isLoading = useAuthSessionStore((state: AuthSessionState) => state.isLoading);
    const login = useAuthSessionStore((state: AuthSessionState) => state.actions.login);
    const clearError = useAuthSessionStore((state: AuthSessionState) => state.actions.clearError);

    const form = useZodForm<LoginFormValues>(loginSchema, {
        defaultValues: {
            tenantId: "",
            email: "",
            password: "",
        },
    });


    // eslint-disable-next-line react-hooks/refs
    const onSubmit = form.handleSubmit(async (values: LoginFormValues) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            clearError();
            const result = await login(values);
            if (result.success) {
                show({
                    severity: "success",
                    summary: "Inicio de sesión exitoso",
                    detail: "¡Bienvenido!",
                    life: 3000,
                });
            } else if (result.error) {
                show({
                    severity: "error",
                    summary: "Error de inicio de sesión",
                    detail: result.error,
                    life: 4000,
                });
            }
        } finally {
            isSubmittingRef.current = false;
        }
    });

    const onSafeSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onSubmit();
    };

    return (
        <form onSubmit={onSafeSubmit} noValidate className="flex flex-column gap-4" style={{ fontFamily: "Inter, -apple-system, sans-serif" }}>
            <FormField
                id="tenantId"
                label="Espacio de Trabajo (Workspace)"
                required
                error={form.formState.errors.tenantId?.message}
            >
                <input
                    id="tenantId"
                    type="text"
                    className="p-inputtext p-component w-full transition-colors"
                    style={{ outline: "none", boxShadow: "none", borderRadius: "8px", fontSize: "15px", padding: "0.875rem", border: "1px solid #D1D5DB" }}
                    onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                    onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                    {...form.register("tenantId")}
                />
            </FormField>

            <FormField
                id="email"
                label="Correo Electrónico"
                required
                error={form.formState.errors.email?.message}
            >
                <input
                    id="email"
                    type="email"
                    className="p-inputtext p-component w-full transition-colors"
                    style={{ outline: "none", boxShadow: "none", borderRadius: "8px", fontSize: "15px", padding: "0.875rem", border: "1px solid #D1D5DB" }}
                    onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                    onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                    autoComplete="email"
                    {...form.register("email")}
                />
            </FormField>

            <FormField
                id="password"
                label="Contraseña"
                required
                error={form.formState.errors.password?.message}
            >
                <input
                    id="password"
                    type="password"
                    className="p-inputtext p-component w-full transition-colors"
                    style={{ outline: "none", boxShadow: "none", borderRadius: "8px", fontSize: "15px", padding: "0.875rem", border: "1px solid #D1D5DB" }}
                    onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                    onBlur={e => e.currentTarget.style.borderColor = "#D1D5DB"}
                    autoComplete="current-password"
                    {...form.register("password")}
                />
                <div className="flex justify-content-end mt-2">
                    <a href="#" className="text-sm font-medium transition-colors" style={{ color: "#3B82F6", textDecoration: "none" }} onMouseOver={(e) => (e.currentTarget.style.color = "#2563EB")} onMouseOut={(e) => (e.currentTarget.style.color = "#3B82F6")}>
                        ¿Olvidaste tu contraseña?
                    </a>
                </div>
            </FormField>

            <div className="mt-2">
                <SubmitButton
                    label="Continuar"
                    loadingLabel="Ingresando..."
                    isSubmitting={isLoading}
                    className="w-full text-white font-semibold py-3 cursor-pointer transition-colors transition-duration-200"
                    style={{ backgroundColor: "#3B82F6", border: "none", borderRadius: "8px", fontSize: "16px" }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3B82F6")}
                />
            </div>
            
            <div className="flex align-items-center mt-3">
                <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E7EB" }}></div>
                <span style={{ margin: "0 1rem", color: "#6B7280", fontSize: "0.875rem", fontWeight: 500 }}>o ingresa con</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E7EB" }}></div>
            </div>

            <button
                type="button"
                className="w-full flex align-items-center justify-content-center py-3 cursor-pointer transition-colors transition-duration-200"
                style={{ backgroundColor: "#ffffff", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "15px", fontWeight: 600, color: "#374151" }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
                <i className="pi pi-google mr-2" style={{ color: "#EA4335" }}></i>
                Continuar con Google
            </button>
        </form>
    );
};
