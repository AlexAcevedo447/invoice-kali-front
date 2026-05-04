import type {
  IdempotentRequestOptions,
  RequestOptions,
} from "@modules/invoicing/domain/repositories";
import type { HttpRequestConfig } from "@shared/infrastructure/http";

export const toPublicConfig = (
  options?: RequestOptions,
): HttpRequestConfig | undefined => {
  if (!options) {
    return undefined;
  }

  return {
    signal: options.signal,
  };
};

export const toIdempotentConfig = (
  options: IdempotentRequestOptions,
): HttpRequestConfig => ({
  signal: options.signal,
  idempotencyKey: options.idempotencyKey,
});
