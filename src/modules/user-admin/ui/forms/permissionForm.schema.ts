import { z } from "zod";
import type { PermissionCatalog } from "@modules/auth-context/domain/entities/PermissionCatalog";

export const WILDCARD = "*";

/** Acciones válidas cuando el recurso es el comodín "*" (MATRIZ_PERMISOS.md). */
export const WILDCARD_RESOURCE_ACTIONS = ["*", "read", "manage"] as const;

/** Normaliza como el servidor: sin espacios a los lados y en minúsculas. */
export const normalizePermissionPart = (raw: string): string => raw.trim().toLowerCase();

/** Recursos seleccionables: el comodín más los del catálogo. */
export const resourceOptions = (catalog: PermissionCatalog): string[] => [
    WILDCARD,
    ...catalog.resources.map((entry) => entry.resource).filter((resource) => resource !== WILDCARD),
];

/**
 * Acciones seleccionables para un recurso: con recurso "*" solo `*`, `read` o
 * `manage`; con un recurso del catálogo, el comodín más sus acciones.
 */
export const actionOptions = (catalog: PermissionCatalog, resource: string): string[] => {
    const normalized = normalizePermissionPart(resource);
    if (normalized === WILDCARD) return [...WILDCARD_RESOURCE_ACTIONS];
    const entry = catalog.resources.find((item) => item.resource === normalized);
    if (!entry) return [];
    return [WILDCARD, ...entry.actions.filter((action) => action !== WILDCARD)];
};

/**
 * Crear y editar permiso (RF-07): recurso y acción obligatorios, normalizados y
 * elegidos del catálogo del servidor (o "*"). Mismas reglas de comodín que el
 * servidor: si el recurso es "*", la acción debe ser "*", "read" o "manage".
 */
export const createPermissionSchema = (catalog: PermissionCatalog) =>
    z
        .object({
            resource: z
                .string()
                .transform(normalizePermissionPart)
                .refine((value) => value.length > 0, "El recurso es obligatorio."),
            action: z
                .string()
                .transform(normalizePermissionPart)
                .refine((value) => value.length > 0, "La acción es obligatoria."),
        })
        .superRefine((value, ctx) => {
            if (!value.resource || !value.action) return;
            if (!resourceOptions(catalog).includes(value.resource)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["resource"],
                    message: "El recurso no está en el catálogo de permisos.",
                });
                return;
            }
            if (!actionOptions(catalog, value.resource).includes(value.action)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["action"],
                    message:
                        value.resource === WILDCARD
                            ? 'Con el recurso "*" la acción debe ser "*", "read" o "manage".'
                            : `La acción no es válida para el recurso "${value.resource}".`,
                });
            }
        });

export type PermissionFormInput = { resource: string; action: string };
export type PermissionFormOutput = { resource: string; action: string };

/** Etiqueta legible de un permiso: recurso/acción. */
export const permissionLabel = (permission: { resource: string; action: string }): string =>
    `${permission.resource}/${permission.action}`;
