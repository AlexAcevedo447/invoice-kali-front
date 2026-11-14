import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useGlobalToast } from "../../../../shared/ui/GlobalToastContext";
import { z } from "zod";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { FormActions } from "../../../../shared/ui/forms/FormActions";
import { FormField } from "../../../../shared/ui/forms/FormField";
import { SubmitButton } from "../../../../shared/ui/forms/SubmitButton";
import { useZodForm } from "../../../../shared/ui/forms/useZodForm";
import { resolveHomeRoute } from "@app/routing/access";

// El usuario nunca escribe el identificador técnico de su empresa: el servidor
// la resuelve a partir de la cuenta. Solo si el mismo correo y contraseña
// existen en varias empresas se pide el código legible de empresa.
const loginSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
    tenantCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const COMPANY_CODE_REQUIRED_STATUS = 409;

export const LoginForm = () => {
    const isSubmittingRef = useRef(false);
    const [needsCompanyCode, setNeedsCompanyCode] = useState(false);
    const { show } = useGlobalToast();
    const isLoading = useAuthSessionStore((state: AuthSessionState) => state.isLoading);
    const login = useAuthSessionStore((state: AuthSessionState) => state.actions.login);
    const clearError = useAuthSessionStore((state: AuthSessionState) => state.actions.clearError);
    const logout = useAuthSessionStore((state: AuthSessionState) => state.actions.logout);

    const form = useZodForm<LoginFormValues>(loginSchema, {
        defaultValues: {
            email: "",
            password: "",
            tenantCode: "",
        },
    });

    const submitValues = async (values: LoginFormValues) => {
        clearError();
        const tenantCode = values.tenantCode?.trim().toLowerCase();
        if (needsCompanyCode && !tenantCode) {
            form.setError("tenantCode", { message: "Company code is required" });
            return;
        }
        const result = await login({
            email: values.email.trim(),
            password: values.password,
            ...(needsCompanyCode && tenantCode ? { tenantCode } : {}),
        });
        if (result.success) {
            // Un usuario sin roles/permisos reconocidos no puede usar ningún módulo:
            // se informa el motivo y no se deja una sesión abierta sin salida.
            const { roles, permissions } = useAuthSessionStore.getState();
            if (!resolveHomeRoute(roles, permissions)) {
                logout();
                show({
                    severity: "error",
                    summary: "Acceso denegado",
                    detail: "Tu usuario no tiene permisos asignados para ingresar.",
                    life: 5000,
                });
                return;
            }
            show({
                severity: "success",
                summary: "Inicio de sesión exitoso",
                detail: "¡Bienvenido!",
                life: 3000,
            });
            return;
        }

        if (result.status === COMPANY_CODE_REQUIRED_STATUS && !needsCompanyCode) {
            setNeedsCompanyCode(true);
        }
        if (result.error) {
            show({
                severity: result.status === COMPANY_CODE_REQUIRED_STATUS ? "warn" : "error",
                summary: "Error de inicio de sesión",
                detail: result.error,
                life: 5000,
            });
        }
    };

    // La guarda contra envíos duplicados vive en el manejador del evento (no en
    // render): cubre validación + petición y se libera siempre al terminar.
    const onSafeSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await form.handleSubmit(submitValues)();
        } finally {
            isSubmittingRef.current = false;
        }
    };

    return (
        <section className="surface-card p-4 border-round border-1 border-300 mb-4">
            <h2 className="mt-0 mb-3">Login</h2>
            <form onSubmit={onSafeSubmit} noValidate>
                <FormField
                    id="email"
                    label="Email"
                    required
                    error={form.formState.errors.email?.message}
                >
                    <input
                        id="email"
                        type="email"
                        className="p-inputtext p-component w-full"
                        autoComplete="email"
                        {...form.register("email")}
                    />
                </FormField>

                <FormField
                    id="password"
                    label="Password"
                    required
                    error={form.formState.errors.password?.message}
                >
                    <input
                        id="password"
                        type="password"
                        className="p-inputtext p-component w-full"
                        autoComplete="current-password"
                        {...form.register("password")}
                    />
                </FormField>

                {needsCompanyCode ? (
                    <FormField
                        id="tenantCode"
                        label="Código de empresa"
                        required
                        hint="Tu correo pertenece a varias empresas. Escribe el código de la empresa a la que quieres ingresar."
                        error={form.formState.errors.tenantCode?.message}
                    >
                        <input
                            id="tenantCode"
                            type="text"
                            data-cy="login-company-code"
                            className="p-inputtext p-component w-full"
                            autoComplete="organization"
                            {...form.register("tenantCode")}
                        />
                    </FormField>
                ) : null}

                <FormActions>
                    <SubmitButton
                        label="Sign In"
                        loadingLabel="Signing In..."
                        isSubmitting={isLoading}
                    />
                </FormActions>
            </form>
        </section>
    );
};
