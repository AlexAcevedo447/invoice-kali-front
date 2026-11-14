/**
 * Motivo por el que una respuesta del servidor obliga a cerrar la sesión.
 * - "expired": el token venció o ya no es válido (401).
 * - "tenant-suspended": la empresa de la sesión fue suspendida; el servidor
 *   rechaza incluso los tokens emitidos antes de la suspensión (403).
 */
export type SessionEndReason = "expired" | "tenant-suspended";

/**
 * Decide si una respuesta de error debe cerrar la sesión. Solo aplica a
 * peticiones que llevaban token y que no son el propio login.
 */
export const sessionEndReasonFor = (
    status: number | undefined,
    backendMessage: unknown,
): SessionEndReason | null => {
    if (status === 401) return "expired";
    if (
        status === 403 &&
        typeof backendMessage === "string" &&
        backendMessage.trim().toLowerCase() === "tenant is suspended"
    ) {
        return "tenant-suspended";
    }
    return null;
};

export const SESSION_END_MESSAGES: Record<SessionEndReason, { summary: string; detail: string }> = {
    expired: {
        summary: "Sesión expirada",
        detail: "Tu sesión ha expirado. Inicia sesión nuevamente.",
    },
    "tenant-suspended": {
        summary: "Empresa suspendida",
        detail: "Tu empresa fue suspendida y la sesión se cerró. Contacta al administrador de la plataforma.",
    },
};
