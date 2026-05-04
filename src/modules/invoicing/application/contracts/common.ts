import type {
  IdempotentRequestOptions,
  RequestOptions,
} from "@modules/invoicing/domain/repositories";

export type PublicRequest = RequestOptions;
export type IdempotentRequest = IdempotentRequestOptions;
