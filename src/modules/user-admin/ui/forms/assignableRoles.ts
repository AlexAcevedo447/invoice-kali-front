import { permissionCovers } from "@app/routing/access";

type PermissionLike = { resource: string; action: string };

/**
 * Roles que quien crea un usuario puede asignarle (CA-04.6, regla "no otorgar
 * más de lo propio"): roles con al menos un permiso (un rol vacío dejaría al
 * usuario sin acceso) y cuyos permisos estén todos cubiertos por los permisos
 * efectivos de la sesión. Si algún permiso del rol no se conoce, no se ofrece.
 * El servidor aplica la misma regla (403 "cannot grant privileges you do not have").
 */
export const assignableRoles = <TRole extends { id: unknown }>(
    roles: readonly TRole[],
    rolePermissionIds: ReadonlyMap<string, readonly unknown[]>,
    permissionsById: ReadonlyMap<string, PermissionLike>,
    sessionPermissions: readonly PermissionLike[],
): TRole[] =>
    roles.filter((role) => {
        const ids = rolePermissionIds.get(String(role.id)) ?? [];
        if (ids.length === 0) return false;
        return ids.every((id) => {
            const permission = permissionsById.get(String(id));
            return (
                permission !== undefined &&
                sessionPermissions.some((granted) =>
                    permissionCovers(granted, permission.resource, permission.action),
                )
            );
        });
    });
