import type {
  AssignRolePermissionCommand,
  AssignUserRoleCommand,
  IdempotentProtectedRequest,
  ProtectedRequest,
  RemoveRolePermissionCommand,
  RemoveUserRoleCommand,
  RolePermissionsQuery,
  RolePermissionsResult,
  UserEffectivePermissionsQuery,
  UserEffectivePermissionsResult,
  UserRolesQuery,
  UserRolesResult,
} from "@modules/auth-context/application/contracts";
import type { RbacRepository } from "@modules/auth-context/domain/repositories/RbacRepository";
import {
  toPermissionId,
  toRoleId,
  toTenantId,
  toUserId,
} from "@modules/auth-context/domain/value-objects";

export class AssignUserRoleUseCase {
  private readonly rbacRepository: RbacRepository;

  constructor(rbacRepository: RbacRepository) {
    this.rbacRepository = rbacRepository;
  }

  execute(
    command: AssignUserRoleCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.rbacRepository.assignUserRole(
      {
        tenantId: toTenantId(command.tenantId),
        userId: toUserId(command.userId),
        roleId: toRoleId(command.roleId),
      },
      options,
    );
  }
}

export class RemoveUserRoleUseCase {
  private readonly rbacRepository: RbacRepository;

  constructor(rbacRepository: RbacRepository) {
    this.rbacRepository = rbacRepository;
  }

  execute(command: RemoveUserRoleCommand, options: ProtectedRequest): Promise<void> {
    return this.rbacRepository.removeUserRole(
      {
        tenantId: toTenantId(command.tenantId),
        userId: toUserId(command.userId),
        roleId: toRoleId(command.roleId),
      },
      options,
    );
  }
}

export class AssignRolePermissionUseCase {
  private readonly rbacRepository: RbacRepository;

  constructor(rbacRepository: RbacRepository) {
    this.rbacRepository = rbacRepository;
  }

  execute(
    command: AssignRolePermissionCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.rbacRepository.assignRolePermission(
      {
        tenantId: toTenantId(command.tenantId),
        roleId: toRoleId(command.roleId),
        permissionId: toPermissionId(command.permissionId),
      },
      options,
    );
  }
}

export class RemoveRolePermissionUseCase {
  private readonly rbacRepository: RbacRepository;

  constructor(rbacRepository: RbacRepository) {
    this.rbacRepository = rbacRepository;
  }

  execute(
    command: RemoveRolePermissionCommand,
    options: ProtectedRequest,
  ): Promise<void> {
    return this.rbacRepository.removeRolePermission(
      {
        tenantId: toTenantId(command.tenantId),
        roleId: toRoleId(command.roleId),
        permissionId: toPermissionId(command.permissionId),
      },
      options,
    );
  }
}

export class GetUserRolesUseCase {
  private readonly rbacRepository: RbacRepository;

  constructor(rbacRepository: RbacRepository) {
    this.rbacRepository = rbacRepository;
  }

  execute(query: UserRolesQuery, options: ProtectedRequest): Promise<UserRolesResult> {
    return this.rbacRepository.getUserRoles(
      {
        tenantId: toTenantId(query.tenantId),
        userId: toUserId(query.userId),
      },
      options,
    );
  }
}

export class GetRolePermissionsUseCase {
  private readonly rbacRepository: RbacRepository;

  constructor(rbacRepository: RbacRepository) {
    this.rbacRepository = rbacRepository;
  }

  execute(
    query: RolePermissionsQuery,
    options: ProtectedRequest,
  ): Promise<RolePermissionsResult> {
    return this.rbacRepository.getRolePermissions(
      {
        tenantId: toTenantId(query.tenantId),
        roleId: toRoleId(query.roleId),
      },
      options,
    );
  }
}

export class GetUserEffectivePermissionsUseCase {
  private readonly rbacRepository: RbacRepository;

  constructor(rbacRepository: RbacRepository) {
    this.rbacRepository = rbacRepository;
  }

  execute(
    query: UserEffectivePermissionsQuery,
    options: ProtectedRequest,
  ): Promise<UserEffectivePermissionsResult> {
    return this.rbacRepository.getUserEffectivePermissions(
      {
        tenantId: toTenantId(query.tenantId),
        userId: toUserId(query.userId),
      },
      options,
    );
  }
}
