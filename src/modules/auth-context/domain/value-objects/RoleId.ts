import type { Brand } from "@core/types/brand";

export type RoleId = Brand<string, "RoleId">;

export const toRoleId = (value: string): RoleId => value as RoleId;
