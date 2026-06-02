import { AxiosHttpClient } from "./AxiosHttpClient";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.trim() || "/";

export const httpCore = new AxiosHttpClient({
  baseURL: apiBaseURL,
  idempotency: {
    enabled: true,
  },
});
