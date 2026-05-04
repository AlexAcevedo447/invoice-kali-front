import type { ServiceHealth } from "@modules/auth-context/domain/entities/ServiceHealth";
import type { HealthRepository } from "@modules/auth-context/domain/repositories/HealthRepository";
import type { PublicRequest } from "@modules/auth-context/application/contracts/common";

export class GetServiceRootStatusUseCase {
  private readonly healthRepository: HealthRepository;

  constructor(healthRepository: HealthRepository) {
    this.healthRepository = healthRepository;
  }

  execute(options?: PublicRequest): Promise<ServiceHealth> {
    return this.healthRepository.getRoot(options);
  }
}

export class CheckHealthUseCase {
  private readonly healthRepository: HealthRepository;

  constructor(healthRepository: HealthRepository) {
    this.healthRepository = healthRepository;
  }

  execute(options?: PublicRequest): Promise<void> {
    return this.healthRepository.checkHealth(options);
  }
}
