export interface ServiceHealth {
  service: string;
  status: "up" | "down" | string;
}
