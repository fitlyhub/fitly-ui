export type TenantResolvedBy = 'DOMAIN' | 'USER_INPUT';

export interface TenantContext {
  loginLogoUrl: string | null;
  resolvedBy: TenantResolvedBy;
  tenantCode: string;
  tenantId: string;
  tenantName: string;
}

export interface ResolveTenantInput {
  host?: string;
  tenantCode?: string;
}
