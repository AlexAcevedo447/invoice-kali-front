import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { getAccessToken } from "@app/state/authSessionStore";
import axiosRetry from "axios-retry";
import type {
  HttpClient,
  HttpRequestBody,
  HttpRequestConfig,
} from "@shared/application/http/HttpClient";
import { HttpError } from "@shared/application/http/HttpError";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
type IdempotentMutationMethod = "post" | "put" | "patch";
type UnknownRecord = Record<string, unknown>;
type ErrorPayload = { message?: string } | string;

export interface AxiosHttpClientConfig {
  baseURL?: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
  idempotency?: {
    enabled: boolean;
    methods?: ReadonlyArray<IdempotentMutationMethod>;
    headerName?: string;
  };
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 3;

export class AxiosHttpClient implements HttpClient {
  private readonly client: AxiosInstance;
  private readonly idempotencyConfig: Required<
    NonNullable<AxiosHttpClientConfig["idempotency"]>
  >;

  constructor(config: AxiosHttpClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      headers: {
        Accept: "application/json",
        ...(config.defaultHeaders ?? {}),
      },
    });

    this.idempotencyConfig = {
      enabled: config.idempotency?.enabled ?? true,
      methods: config.idempotency?.methods ?? ["post", "put", "patch"],
      headerName: config.idempotency?.headerName ?? "Idempotency-Key",
    };

    axiosRetry(this.client, {
      retries: config.retries ?? DEFAULT_RETRIES,
      retryDelay: axiosRetry.exponentialDelay,
      shouldResetTimeout: true,
      retryCondition: (error: unknown): boolean => {
        if (!isAxiosErrorWithPayload(error)) {
          return false;
        }

        const method = error.config?.method?.toLowerCase();
        const isIdempotentMethod =
          method === "get" ||
          method === "head" ||
          method === "options" ||
          method === "delete";
        const headers = AxiosHeaders.from(error.config?.headers);
        const hasIdempotencyKey = headers.has(
          this.idempotencyConfig.headerName,
        );
        const statusCode = error.response?.status;
        const isTransientStatus =
          statusCode === 429 ||
          (typeof statusCode === "number" && statusCode >= 500);

        if (isIdempotentMethod) {
          return axiosRetry.isNetworkOrIdempotentRequestError(error);
        }

        return (
          Boolean(method) &&
          !isIdempotentMethod &&
          hasIdempotencyKey &&
          (axiosRetry.isNetworkError(error) || isTransientStatus)
        );
      },
      onRetry: (
        _retryCount: number,
        _error: unknown,
        requestConfig: AxiosRequestConfig,
      ): void => {
        if (requestConfig.timeout && config.retryDelayMs) {
          requestConfig.timeout += config.retryDelayMs;
        }
      },
    });
  }

  async get<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    return this.request<T>("get", url, undefined, config);
  }

  async post<T, TBody extends HttpRequestBody = HttpRequestBody>(
    url: string,
    body: TBody,
    config?: HttpRequestConfig,
  ): Promise<T> {
    return this.request<T>("post", url, body, config);
  }

  async put<T, TBody extends HttpRequestBody = HttpRequestBody>(
    url: string,
    body: TBody,
    config?: HttpRequestConfig,
  ): Promise<T> {
    return this.request<T>("put", url, body, config);
  }

  async patch<T, TBody extends HttpRequestBody = HttpRequestBody>(
    url: string,
    body: TBody,
    config?: HttpRequestConfig,
  ): Promise<T> {
    return this.request<T>("patch", url, body, config);
  }

  async delete<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    return this.request<T>("delete", url, undefined, config);
  }

  private async request<T>(
    method: HttpMethod,
    url: string,
    data?: HttpRequestBody,
    config?: HttpRequestConfig,
  ): Promise<T> {
    const axiosConfig: AxiosRequestConfig = {
      method,
      url,
      data,
      signal: config?.signal,
      timeout: config?.timeoutMs,
      params: config?.params,
      headers: {
        ...(config?.headers ?? {}),
      },
    };

    // Inyectar el accessToken JWT si existe
    const token = getAccessToken();
    if (token) {
      axiosConfig.headers = {
        ...axiosConfig.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    this.attachIdempotencyKeyIfNeeded(method, axiosConfig, config);

    try {
      const response = await this.client.request<T>(axiosConfig);
      return response.data;
    } catch (error) {
      throw this.mapHttpError(error);
    }
  }

  private attachIdempotencyKeyIfNeeded(
    method: HttpMethod,
    axiosConfig: AxiosRequestConfig,
    config?: HttpRequestConfig,
  ): void {
    if (!this.idempotencyConfig.enabled) {
      return;
    }

    if (!isIdempotentMutationMethod(method)) {
      return;
    }

    if (!this.idempotencyConfig.methods.includes(method)) {
      return;
    }

    const key = config?.idempotencyKey ?? this.generateIdempotencyKey();
    const headerName = this.idempotencyConfig.headerName;

    axiosConfig.headers = {
      ...(axiosConfig.headers ?? {}),
      [headerName]: key,
    };
  }

  private mapHttpError(error: unknown): HttpError {
    if (isAxiosErrorWithPayload(error)) {
      const status = error.response?.status ?? 500;
      const statusText = error.response?.statusText ?? "Network Error";
      const message = this.extractErrorMessage(error);
      return new HttpError(status, statusText, message);
    }

    if (error instanceof Error) {
      return new HttpError(500, "Unexpected Error", error.message);
    }

    return new HttpError(500, "Unexpected Error");
  }

  private extractErrorMessage(
    error: AxiosError<ErrorPayload>,
  ): string | undefined {
    const payload = error.response?.data;

    if (typeof payload === "string") {
      return payload;
    }

    if (isRecord(payload)) {
      const message = payload["message"];
      if (typeof message === "string") {
        return message;
      }
    }

    return error.message;
  }

  private generateIdempotencyKey(): string {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

const isIdempotentMutationMethod = (
  method: HttpMethod,
): method is IdempotentMutationMethod => {
  return method === "post" || method === "put" || method === "patch";
};

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null;
};

const isAxiosErrorWithPayload = (
  value: unknown,
): value is AxiosError<ErrorPayload> => {
  return axios.isAxiosError<ErrorPayload>(value);
};
