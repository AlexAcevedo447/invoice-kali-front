import type { Brand } from "@core/types/brand";

export type PermissionId = Brand<string, "PermissionId">;

export const toPermissionId = (value: string): PermissionId =>
  value as PermissionId;
