import type { TenantContext, TenantResolvedBy } from '@/features/tenant/model/tenant.types';

interface TenantDirectoryUser {
  displayName: string;
  role: string;
  userId: string;
  username: string;
}

interface TenantDirectoryEntry {
  hosts: string[];
  loginLogoUrl: string | null;
  tenantCode: string;
  tenantId: string;
  tenantName: string;
  users: Record<string, TenantDirectoryUser>;
}

export const authCompanyName = 'Fitly';

const tenantDirectory: TenantDirectoryEntry[] = [
  {
    hosts: ['tenant-a.fitly.vn'],
    loginLogoUrl: null,
    tenantCode: 'tenant-a',
    tenantId: 'tenant_002',
    tenantName: 'Tenant A Manufacturing',
    users: {
      admin: {
        displayName: 'Tenant Admin',
        role: 'Operations Director',
        userId: '100201',
        username: 'admin',
      },
      buyer: {
        displayName: 'Tenant Buyer',
        role: 'Procurement Lead',
        userId: '100202',
        username: 'buyer',
      },
    },
  },
  {
    hosts: ['erp.customer-a.com'],
    loginLogoUrl: null,
    tenantCode: 'customer-a',
    tenantId: 'tenant_003',
    tenantName: 'Customer A ERP',
    users: {
      admin: {
        displayName: 'Customer Admin',
        role: 'Operations Director',
        userId: '100301',
        username: 'admin',
      },
      hr: {
        displayName: 'Customer HR',
        role: 'People Operations',
        userId: '100302',
        username: 'hr',
      },
    },
  },
  {
    hosts: [],
    loginLogoUrl: null,
    tenantCode: 'fitly-demo',
    tenantId: 'tenant_001',
    tenantName: 'Fitly Demo',
    users: {
      admin: {
        displayName: 'Fitly Admin',
        role: 'Operations Director',
        userId: '100001',
        username: 'admin',
      },
      buyer: {
        displayName: 'Fitly Buyer',
        role: 'Procurement Lead',
        userId: '100002',
        username: 'buyer',
      },
      hr: {
        displayName: 'Fitly HR',
        role: 'People Operations',
        userId: '100003',
        username: 'hr',
      },
    },
  },
];

const normalizeHost = (host: string): string => host.trim().toLowerCase();

const normalizeTenantCode = (tenantCode: string): string =>
  tenantCode.trim().toLowerCase();

const normalizeUsername = (username: string): string => username.trim().toLowerCase();

export const findTenantByCode = (
  tenantCode: string,
): TenantDirectoryEntry | undefined => {
  const normalizedTenantCode = normalizeTenantCode(tenantCode);

  return tenantDirectory.find(
    (tenant) => normalizeTenantCode(tenant.tenantCode) === normalizedTenantCode,
  );
};

export const findTenantByHost = (
  host: string,
): TenantDirectoryEntry | undefined => {
  const normalizedHost = normalizeHost(host);

  return tenantDirectory.find((tenant) =>
    tenant.hosts.some((tenantHost) => normalizeHost(tenantHost) === normalizedHost),
  );
};

export const findTenantById = (
  tenantId: string,
): TenantDirectoryEntry | undefined => {
  return tenantDirectory.find((tenant) => tenant.tenantId === tenantId);
};

export const findTenantUser = (
  tenantId: string,
  username: string,
): TenantDirectoryUser | undefined => {
  const tenant = findTenantById(tenantId);

  if (!tenant) {
    return undefined;
  }

  return tenant.users[normalizeUsername(username)];
};

export const getTenantCodeOptions = (): Array<{ label: string; value: string }> => {
  return tenantDirectory.map((tenant) => ({
    label: tenant.tenantCode,
    value: tenant.tenantCode,
  }));
};

export const toTenantContext = (
  tenant: TenantDirectoryEntry,
  resolvedBy: TenantResolvedBy,
): TenantContext => {
  return {
    loginLogoUrl: tenant.loginLogoUrl,
    resolvedBy,
    tenantCode: tenant.tenantCode,
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
  };
};
