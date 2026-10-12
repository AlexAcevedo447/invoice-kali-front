/**
 * Traducción centralizada de mensajes conocidos de los servicios backend
 * (kali-auth-context y kali-invoice-service) a textos para el usuario.
 *
 * Solo se traducen mensajes con equivalencia exacta conocida; cualquier otro
 * mensaje se devuelve tal cual para no ocultar errores desconocidos.
 */
const KNOWN_MESSAGES: Record<string, string> = {
  // Autenticación
  "invalid credentials": "Credenciales incorrectas.",
  // Usuarios
  "a user with this email already exists for this tenant":
    "Ya existe un usuario registrado con este correo electrónico.",
  "password must have at least 12 characters":
    "La contraseña debe tener al menos 12 caracteres.",
  "password must include at least one uppercase letter":
    "La contraseña debe incluir al menos una letra mayúscula.",
  "password must include at least one lowercase letter":
    "La contraseña debe incluir al menos una letra minúscula.",
  "password must include at least one digit":
    "La contraseña debe incluir al menos un número.",
  "password must include at least one symbol":
    "La contraseña debe incluir al menos un símbolo.",
  "password must not contain whitespace":
    "La contraseña no debe contener espacios.",
  // Facturas
  "invoice is already paid": "La factura ya se encuentra pagada.",
  "invoice is already canceled": "La factura ya se encuentra cancelada.",
  "invoice not found": "La factura no existe.",
  "due_date cannot be before issue_date":
    "La fecha de vencimiento no puede ser anterior a la fecha de emisión.",
  // Idempotencia (ambos servicios)
  "idempotency request is still being processed":
    "La solicitud anterior aún se está procesando. Intenta nuevamente en unos segundos.",
  "idempotency request in progress":
    "La solicitud anterior aún se está procesando. Intenta nuevamente en unos segundos.",
};

export const translateBackendMessage = (message: string): string =>
  KNOWN_MESSAGES[message.trim().toLowerCase()] ?? message;
