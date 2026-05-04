export type HttpPrimitive = string | number | boolean;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

export type HttpRequestBody =
  | JsonValue
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | null;

export interface HttpRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, HttpPrimitive | null | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string;
}

export interface HttpClient {
  get<T>(url: string, config?: HttpRequestConfig): Promise<T>;
  post<T, TBody extends HttpRequestBody = HttpRequestBody>(
    url: string,
    body: TBody,
    config?: HttpRequestConfig,
  ): Promise<T>;
  put<T, TBody extends HttpRequestBody = HttpRequestBody>(
    url: string,
    body: TBody,
    config?: HttpRequestConfig,
  ): Promise<T>;
  patch<T, TBody extends HttpRequestBody = HttpRequestBody>(
    url: string,
    body: TBody,
    config?: HttpRequestConfig,
  ): Promise<T>;
  delete<T>(url: string, config?: HttpRequestConfig): Promise<T>;
}
