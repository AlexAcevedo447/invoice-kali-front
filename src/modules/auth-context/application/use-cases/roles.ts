import type {
  CreateRoleCommand,
  DeleteRoleCommand,
  GetRoleByIdQuery,
  IdempotentProtectedRequest,
  ListRolesQuery,
  ProtectedRequest,
  RoleListResult,
  RoleResult,
  UpdateRoleCommand,
} from "@modules/auth-context/application/contracts";
import type { RoleRepository } from "@modules/auth-context/domain/repositories/RoleRepository";
import { toRoleId, toTenantId } from "@modules/auth-context/domain/value-objects";

export class CreateRoleUseCase {
  private readonly roleRepository: RoleRepository;

  constructor(roleRepository: RoleRepository) {
    this.roleRepository = roleRepository;
  }

  execute(command: CreateRoleCommand, options: IdempotentProtectedRequest): Promise<void> {
    return this.roleRepository.create(
      {
        tenantId: toTenantId(command.tenantId),
        name: command.name,
        description: command.description,
      },
      options,
    );
  }
}

export class ListRolesUseCase {
  private readonly roleRepository: RoleRepository;

  constructor(roleRepository: RoleRepository) {
    this.roleRepository = roleRepository;
  }

  execute(query: ListRolesQuery, options: ProtectedRequest): Promise<RoleListResult> {
    return this.roleRepository.list(
      {
        tenantId: toTenantId(query.tenantId),
      },
      options,
    );
  }
}

export class GetRoleByIdUseCase {
  private readonly roleRepository: RoleRepository;

  constructor(roleRepository: RoleRepository) {
    this.roleRepository = roleRepository;
  }

  execute(query: GetRoleByIdQuery, options: ProtectedRequest): Promise<RoleResult> {
    return this.roleRepository.getById(
      {
        roleId: toRoleId(query.roleId),
      },
      options,
    );
  }
}

export class UpdateRoleUseCase {
  private readonly roleRepository: RoleRepository;

  constructor(roleRepository: RoleRepository) {
    this.roleRepository = roleRepository;
  }

  execute(command: UpdateRoleCommand, options: IdempotentProtectedRequest): Promise<void> {
    return this.roleRepository.update(
      {
        roleId: toRoleId(command.roleId),
        tenantId: toTenantId(command.tenantId),
        name: command.name,
        description: command.description,
      },
      options,
    );
  }
}

export class DeleteRoleUseCase {
  private readonly roleRepository: RoleRepository;

  constructor(roleRepository: RoleRepository) {
    this.roleRepository = roleRepository;
  }

  execute(command: DeleteRoleCommand, options: IdempotentProtectedRequest): Promise<void> {
    return this.roleRepository.delete(
      {
        roleId: toRoleId(command.roleId),
      },
      options,
    );
  }
}
