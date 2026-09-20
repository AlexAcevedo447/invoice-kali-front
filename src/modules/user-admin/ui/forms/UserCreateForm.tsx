import { useRef } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { useApplication } from "../../../../app/application/useApplication";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { createIdempotencyKey } from "../../../../app/state/createIdempotencyKey";
import { toTenantId } from "../../../auth-context/domain/value-objects/TenantId";
import { HttpError } from "../../../../shared/application/http/HttpError";
import { FormActions } from "../../../../shared/ui/forms/FormActions";
import { FormField } from "../../../../shared/ui/forms/FormField";
import { SubmitButton } from "../../../../shared/ui/forms/SubmitButton";
import { useZodForm } from "../../../../shared/ui/forms/useZodForm";
import { useGlobalToast } from "../../../../shared/ui/GlobalToastContext";

const userSchema = z.object({
    identificationNumber: z.string().min(1, "Identification number is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type UserFormValues = z.infer<typeof userSchema>;

export const UserCreateForm = () => {
    const isSubmittingRef = useRef(false);
    const { show } = useGlobalToast();
    const application = useApplication();
    const accessToken = useAuthSessionStore((state: AuthSessionState) => state.accessToken);
    const tenantId = useAuthSessionStore((state: AuthSessionState) => state.tenantId);

    const form = useZodForm<UserFormValues>(userSchema, {
        defaultValues: {
            identificationNumber: "",
            username: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = form.handleSubmit(async (values: UserFormValues) => {
        if (isSubmittingRef.current) return;
        if (!accessToken || !tenantId) return;
        isSubmittingRef.current = true;

        try {
            await application.authContext.users.create(
                {
                    tenantId: toTenantId(tenantId),
                    identificationNumber: values.identificationNumber,
                    username: values.username,
                    email: values.email,
                    password: values.password,
                },
                {
                    accessToken,
                    idempotencyKey: createIdempotencyKey(),
                }
            );

            show({
                severity: "success",
                summary: "Usuario creado",
                detail: "El usuario se creó correctamente.",
                life: 3000,
            });
            form.reset();
        } catch (error) {
            if (error instanceof HttpError && error.status === 409) {
                show({
                    severity: "error",
                    summary: "Email duplicado",
                    detail: "Ya existe un usuario registrado con este correo electrónico.",
                    life: 4000,
                });
            } else {
                show({
                    severity: "error",
                    summary: "Error al crear usuario",
                    detail: "No se pudo crear el usuario. Intenta nuevamente.",
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
        <section className="surface-card p-4 border-round border-1 border-300 mb-4">
            <h3 className="mt-0 mb-3">Crear usuario</h3>
            <form onSubmit={onSafeSubmit} noValidate>
                <FormField
                    id="identificationNumber"
                    label="Identification Number"
                    required
                    error={form.formState.errors.identificationNumber?.message}
                >
                    <input
                        id="identificationNumber"
                        type="text"
                        data-cy="user-identification"
                        className="p-inputtext p-component w-full"
                        {...form.register("identificationNumber")}
                    />
                </FormField>

                <FormField
                    id="username"
                    label="Username"
                    required
                    error={form.formState.errors.username?.message}
                >
                    <input
                        id="username"
                        type="text"
                        data-cy="user-username"
                        className="p-inputtext p-component w-full"
                        {...form.register("username")}
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
                        data-cy="user-email"
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
                        data-cy="user-password"
                        className="p-inputtext p-component w-full"
                        autoComplete="new-password"
                        {...form.register("password")}
                    />
                </FormField>

                <FormActions>
                    <SubmitButton
                        label="Crear usuario"
                        loadingLabel="Creando..."
                        isSubmitting={form.formState.isSubmitting}
                        data-cy="user-submit"
                    />
                </FormActions>
            </form>
        </section>
    );
};
