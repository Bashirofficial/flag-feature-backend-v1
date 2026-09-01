import { Prisma } from "@prisma/client";

export type FeatureFlagValue = Prisma.JsonValue;

export type FlagsMap = Record<string, FeatureFlagValue>;

export interface CachedFlag {
  key: string;
  value: FeatureFlagValue;
  type: string;
}

export interface CachedApiKey {
  id: string;
  organizationId: string;
  environmentId: string;
  environmentKey: string;
  status: string;
  revokedAt: Date | null;
}
