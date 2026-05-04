import type {
  CreatePermissionCommand,
  DeletePermissionCommand,
  GetPermissionByIdQuery,
  IdempotentProtectedRequest,
  ListPermissionsQuery,
  PermissionListResult,
  PermissionResult,
  ProtectedRequest,
  UpdatePermissionCommand,
} from "@modules/auth-context/application/contracts";
import type { PermissionRepository } from "@modules/auth-context/domain/repositories/PermissionRepository";
import {
  toPermissionId,
  toTenantId,
} from "@modules/auth-context/domain/value-objects";

export class CreatePermissionUseCase {
  private readonly permissionRepository: PermissionRepository;

  constructor(permissionRepository: PermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  execute(
    command: CreatePermissionCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.permissionRepository.create(
      {
        tenantId: toTenantId(command.tenantId),
        resource: command.resource,
        action: command.action,
      },
      options,
    );
  }
}

export class ListPermissionsUseCase {
  private readonly permissionRepository: PermissionRepository;

  constructor(permissionRepository: PermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  execute(
    query: ListPermissionsQuery,
    options: ProtectedRequest,
  ): Promise<PermissionListResult> {
    return this.permissionRepository.list(
      {
        tenantId: toTenantId(query.tenantId),
      },
      options,
    );
  }
}

export class GetPermissionByIdUseCase {
  private readonly permissionRepository: PermissionRepository;

  constructor(permissionRepository: PermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  execute(
    query: GetPermissionByIdQuery,
    options: ProtectedRequest,
  ): Promise<PermissionResult> {
    return this.permissionRepository.getById(
      {
        permissionId: toPermissionId(query.permissionId),
      },
      options,
    );
  }
}

export class UpdatePermissionUseCase {
  private readonly permissionRepository: PermissionRepository;

  constructor(permissionRepository: PermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  execute(
    command: UpdatePermissionCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.permissionRepository.update(
      {
        permissionId: toPermissionId(command.permissionId),
        tenantId: toTenantId(command.tenantId),
        resource: command.resource,
        action: command.action,
      },
      options,
    );
  }
}

export class DeletePermissionUseCase {
  private readonly permissionRepository: PermissionRepository;

  constructor(permissionRepository: PermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  execute(
    command: DeletePermissionCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.permissionRepository.delete(
      {
        permissionId: toPermissionId(command.permissionId),
      },
      options,
    );
  }
}
