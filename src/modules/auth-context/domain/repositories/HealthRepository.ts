import type { ServiceHealth } from "@modules/auth-context/domain/entities/ServiceHealth";
import type { RequestOptions } from "@modules/auth-context/domain/repositories/RequestOptions";

export interface HealthRepository {
  getRoot(options?: RequestOptions): Promise<ServiceHealth>;
  checkHealth(options?: RequestOptions): Promise<void>;
}
