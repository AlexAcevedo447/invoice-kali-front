import type {
  ChangeTenantStatusCommand,
  CreateTenantCommand,
  GetTenantByIdQuery,
  GetTenantByNameQuery,
  IdempotentProtectedRequest,
  ProtectedRequest,
  TenantListResult,
  TenantResult,
  UpdateTenantCommand,
} from "@modules/auth-context/application/contracts";
import type { TenantRepository } from "@modules/auth-context/domain/repositories/TenantRepository";
import { toTenantId } from "@modules/auth-context/domain/value-objects";

export class CreateTenantUseCase {
  private readonly tenantRepository: TenantRepository;

  constructor(tenantRepository: TenantRepository) {
    this.tenantRepository = tenantRepository;
  }

  execute(
    command: CreateTenantCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.tenantRepository.create({ name: command.name }, options);
  }
}

export class ListTenantsUseCase {
  private readonly tenantRepository: TenantRepository;

  constructor(tenantRepository: TenantRepository) {
    this.tenantRepository = tenantRepository;
  }

  execute(options: ProtectedRequest): Promise<TenantListResult> {
    return this.tenantRepository.list(options);
  }
}

export class GetTenantByIdUseCase {
  private readonly tenantRepository: TenantRepository;

  constructor(tenantRepository: TenantRepository) {
    this.tenantRepository = tenantRepository;
  }

  execute(query: GetTenantByIdQuery, options: ProtectedRequest): Promise<TenantResult> {
    return this.tenantRepository.getById(
      {
        tenantId: toTenantId(query.tenantId),
      },
      options,
    );
  }
}

export class GetTenantByNameUseCase {
  private readonly tenantRepository: TenantRepository;

  constructor(tenantRepository: TenantRepository) {
    this.tenantRepository = tenantRepository;
  }

  execute(query: GetTenantByNameQuery, options: ProtectedRequest): Promise<TenantResult> {
    return this.tenantRepository.getByName(
      {
        name: query.name,
      },
      options,
    );
  }
}

export class UpdateTenantUseCase {
  private readonly tenantRepository: TenantRepository;

  constructor(tenantRepository: TenantRepository) {
    this.tenantRepository = tenantRepository;
  }

  execute(
    command: UpdateTenantCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.tenantRepository.update(
      {
        tenantId: toTenantId(command.tenantId),
        name: command.name,
        status: command.status,
      },
      options,
    );
  }
}

export class ActivateTenantUseCase {
  private readonly tenantRepository: TenantRepository;

  constructor(tenantRepository: TenantRepository) {
    this.tenantRepository = tenantRepository;
  }

  execute(
    command: ChangeTenantStatusCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.tenantRepository.activate(
      {
        tenantId: toTenantId(command.tenantId),
      },
      options,
    );
  }
}

export class SuspendTenantUseCase {
  private readonly tenantRepository: TenantRepository;

  constructor(tenantRepository: TenantRepository) {
    this.tenantRepository = tenantRepository;
  }

  execute(
    command: ChangeTenantStatusCommand,
    options: IdempotentProtectedRequest,
  ): Promise<void> {
    return this.tenantRepository.suspend(
      {
        tenantId: toTenantId(command.tenantId),
      },
      options,
    );
  }
}
