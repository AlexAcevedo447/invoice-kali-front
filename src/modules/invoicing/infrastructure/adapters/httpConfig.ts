import type {
  IdempotentRequestOptions,
  RequestOptions,
} from "@modules/invoicing/domain/repositories/RequestOptions";
import type { HttpRequestConfig } from "@shared/infrastructure/http/HttpClient";

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
  // El cliente HTTP solo añade la clave a POST/PUT/PATCH; el servicio de
  // facturación también la exige en DELETE (p. ej. borrar una línea).
  headers: { "Idempotency-Key": options.idempotencyKey },
});
