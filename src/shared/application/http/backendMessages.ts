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
  "company code required":
    "Tu correo pertenece a varias empresas. Indica el código de empresa.",
  "tenant is suspended": "La empresa está suspendida. Contacta al administrador.",
  "tenant mismatch": "No tienes acceso a la información de otra empresa.",
  "platform administrator required":
    "Esta acción solo la puede realizar el administrador de la plataforma.",
  "resource not found": "El recurso solicitado no existe.",
  // Empresas (las claves van en minúsculas: la búsqueda normaliza el mensaje)
  "tenant name is required": "El nombre de la empresa es obligatorio.",
  "tenant code must have 3-40 lowercase letters, digits or hyphens":
    "El código de empresa debe tener de 3 a 40 minúsculas, números o guiones.",
  "tenant code already exists": "Ya existe una empresa con ese código.",
  "tenant status must be active or suspended": "El estado de la empresa debe ser activa o suspendida.",
  "tenant_id is required": "Falta indicar la empresa.",
  "platform tenant cannot be suspended": "La empresa de la plataforma no se puede suspender.",
  // Roles, permisos y asignaciones (RBAC, incremento 2)
  "insufficient permissions": "No tienes permiso para realizar esta acción.",
  "cannot grant privileges you do not have":
    "No puedes otorgar permisos que tú mismo no tienes.",
  "role name is required": "El nombre del rol es obligatorio.",
  "role name already exists": "Ya existe un rol con ese nombre en tu empresa.",
  "role is assigned to users":
    "El rol está asignado a usuarios. Quítalo de esos usuarios antes de eliminarlo.",
  "protected administrative role":
    "El rol administrador de la plataforma está protegido: no se puede modificar, eliminar ni quitarle su permiso.",
  "permission resource is required": "El recurso del permiso es obligatorio.",
  "permission action is required": "La acción del permiso es obligatoria.",
  "permission already exists": "Ya existe un permiso con ese recurso y acción en tu empresa.",
  "permission is assigned to roles":
    "El permiso está asignado a roles. Quítalo de esos roles antes de modificarlo o eliminarlo.",
  "protected administrative permission":
    "El permiso administrativo de la plataforma (*/*) está protegido: no se puede modificar ni eliminar.",
  "operation would leave the tenant without an administrator":
    "La operación dejaría a la empresa sin ningún administrador. Asigna antes el acceso administrativo a otro usuario.",
  "unknown permission resource": "El recurso no está en el catálogo de permisos.",
  "unknown permission action": "La acción no es válida para ese recurso.",
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
  "invoice item not found": "La línea de factura no existe.",
  // Catálogos
  "customer not found": "El cliente seleccionado no existe en tu empresa.",
  "product not found": "El producto seleccionado no existe en tu empresa.",
  "a customer with this document already exists":
    "Ya existe un cliente con ese documento.",
  "a product with this code already exists": "Ya existe un producto con ese código.",
  "customer name is required": "El nombre del cliente es obligatorio.",
  "customer document is required": "El documento del cliente es obligatorio.",
  "product code is required": "El código del producto es obligatorio.",
  "product name is required": "El nombre del producto es obligatorio.",
  "product unit_price must be greater than or equal to 0":
    "El precio del producto no puede ser negativo.",
  "due_date cannot be before issue_date":
    "La fecha de vencimiento no puede ser anterior a la fecha de emisión.",
  // Error inesperado (500): el servicio no expone el detalle interno.
  "internal server error": "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
  // Validaciones de factura y líneas (el servicio responde 400)
  "customer_id is required": "Selecciona un cliente.",
  "invoice must have at least one item": "La factura debe tener al menos una línea.",
  "invoice_id is required": "Falta la factura de la línea.",
  "item_id is required": "Selecciona un producto.",
  "quantity must be greater than 0": "La cantidad debe ser mayor que 0.",
  "unit_price must be greater than 0": "El precio unitario debe ser mayor que 0.",
  "tax code is required": "El código del impuesto es obligatorio.",
  "tax rate must be greater than or equal to 0": "La tarifa del impuesto no puede ser negativa.",
  "tax kind must be DEBIT or CREDIT": "El tipo de impuesto debe ser débito o crédito.",
  // Idempotencia (ambos servicios)
  "idempotency request is still being processed":
    "La solicitud anterior aún se está procesando. Intenta nuevamente en unos segundos.",
  "idempotency request in progress":
    "La solicitud anterior aún se está procesando. Intenta nuevamente en unos segundos.",
};

export const translateBackendMessage = (message: string): string =>
  KNOWN_MESSAGES[message.trim().toLowerCase()] ?? message;
