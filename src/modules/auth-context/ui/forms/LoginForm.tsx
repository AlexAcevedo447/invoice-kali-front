import type { FormEvent } from "react";
import { useRef } from "react";
import { z } from "zod";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { FormActions } from "../../../../shared/ui/forms/FormActions";
import { FormField } from "../../../../shared/ui/forms/FormField";
import { SubmitButton } from "../../../../shared/ui/forms/SubmitButton";
import { useZodForm } from "../../../../shared/ui/forms/useZodForm";

const loginSchema = z.object({
    tenantId: z.string().min(1, "Tenant ID is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
    const isSubmittingRef = useRef(false);
    const isLoading = useAuthSessionStore((state: AuthSessionState) => state.isLoading);
    const authError = useAuthSessionStore((state: AuthSessionState) => state.error);
    const status = useAuthSessionStore((state: AuthSessionState) => state.status);
    const login = useAuthSessionStore((state: AuthSessionState) => state.actions.login);
    const clearError = useAuthSessionStore((state: AuthSessionState) => state.actions.clearError);

    const form = useZodForm<LoginFormValues>(loginSchema, {
        defaultValues: {
            tenantId: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = form.handleSubmit(async (values: LoginFormValues) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            clearError();
            await login(values);
        } finally {
            isSubmittingRef.current = false;
        }
    });

    const onSafeSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void onSubmit();
    };

    return (
        <section className="surface-card p-4 border-round border-1 border-300 mb-4">
            <h2 className="mt-0 mb-3">Login</h2>
            <form onSubmit={onSafeSubmit} noValidate>
                <FormField
                    id="tenantId"
                    label="Tenant ID"
                    required
                    error={form.formState.errors.tenantId?.message}
                >
                    <input
                        id="tenantId"
                        type="text"
                        className="p-inputtext p-component w-full"
                        {...form.register("tenantId")}
                    />
                </FormField>

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

                {authError ? (
                    <p role="alert" className="text-red-500 m-0 mb-2">
                        {authError}
                    </p>
                ) : null}

                {status === "authenticated" ? (
                    <p className="text-green-500 m-0 mb-2">Authenticated</p>
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
